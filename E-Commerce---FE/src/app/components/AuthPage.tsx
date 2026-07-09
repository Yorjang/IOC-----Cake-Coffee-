import { useState } from "react";
import { CakeSlice, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { AUTH_CONTENT } from "../../constants/authContent";
import { env } from "../../config/env";
import type { AuthMode, AuthErrors } from "./authUtils";
import { validateRegisterFields, apiLogin, apiRegister } from "./authUtils";


// ── Register Options Modal ────────────────────────────────────────────────────
function RegisterModal({ loading, fillDetailsLater, setFillDetailsLater, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl text-left">
        <h3 className="text-2xl font-serif font-bold text-foreground">Tùy chọn thiết lập tài khoản</h3>
        <p className="mt-2 text-sm text-muted-foreground">Vui lòng chọn các tùy chọn thiết lập cho tài khoản mới của bạn.</p>
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">1. Điền thông tin cá nhân</h4>
            <div className="space-y-2">
              {[{ label: "Đăng ký cơ bản", sub: "Bỏ qua số điện thoại để thiết lập sau.", val: true }, { label: "Đăng ký đầy đủ", sub: "Lưu kèm số điện thoại đã nhập.", val: false }].map(opt => (
                <label key={String(opt.val)} className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-secondary/40 transition">
                  <input type="radio" name="detailsOption" checked={fillDetailsLater === opt.val} onChange={() => setFillDetailsLater(opt.val)} className="mt-0.5 accent-primary" />
                  <div><span className="text-sm font-medium text-foreground">{opt.label}</span><p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p></div>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4 border border-border">
            <span className="text-sm font-semibold text-foreground">Xác thực tài khoản</span>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Đường dẫn xác thực sẽ được gửi trực tiếp đến địa chỉ Gmail của bạn.</p>
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-primary/30 py-2.5 text-sm font-semibold text-primary transition hover:bg-secondary">Hủy</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">
            {loading ? "Đang xử lý..." : "Xác nhận & Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Left decorative panel ─────────────────────────────────────────────────────
function AuthLeftPanel({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="relative hidden overflow-hidden border-r bg-sidebar lg:block">
      <img src={AUTH_CONTENT.HERO_IMAGE} alt={AUTH_CONTENT.HERO_IMAGE_ALT} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-r from-sidebar/90 via-sidebar/65 to-sidebar/20" />
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <button type="button" onClick={onSuccess} className="flex items-center gap-3 text-left hover:opacity-85 transition cursor-pointer w-fit">
          <span className="grid size-10 place-items-center rounded-full bg-primary-foreground/20"><CakeSlice size={20} className="text-primary-foreground" /></span>
          <span className="font-serif text-2xl font-bold text-primary-foreground">{AUTH_CONTENT.BRAND_NAME}</span>
        </button>
        <div>
          <h1 className="text-5xl text-primary-foreground">{AUTH_CONTENT.HERO_TITLE}</h1>
          <p className="mt-4 text-lg text-primary-foreground/70">{AUTH_CONTENT.HERO_SUBTITLE}</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {AUTH_CONTENT.HERO_FEATURES.map(t => (<div key={t} className="rounded-2xl bg-primary-foreground/10 p-4 text-sm text-primary-foreground/80">{t}</div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export function AuthPage({ onSuccess }: { onSuccess: () => void; onAdminDemo?: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [showModal, setShowModal] = useState(false);
  const [fillDetailsLater, setFillDetailsLater] = useState(false);

  const switchMode = (m: AuthMode) => {
    setMode(m); setEmail(m === "login" ? "" : "");
    setPassword(""); setPhone(""); setFullName(""); setErrors({});
  };

  async function handleConfirmRegister() {
    setLoading(true);
    try {
      const err = await apiRegister(fullName, email, fillDetailsLater ? undefined : (phone || undefined), password, onSuccess, setMode);
      if (err) setErrors(err);
    } catch (e: any) { toast.error(e.message || "Đã xảy ra lỗi."); }
    finally { setLoading(false); setShowModal(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErrors({});
    try {
      if (mode === "login") {
        setLoading(true);
        const res = await fetch(`${env.API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
        localStorage.setItem("accessToken", data.accessToken); localStorage.setItem("refreshToken", data.refreshToken); localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Đăng nhập thành công!"); onSuccess();
      } else if (mode === "register") {
        const err = validateRegisterFields(fullName, email, phone, password);
        if (Object.keys(err).length) { setErrors(err); toast.error("Vui lòng kiểm tra lại thông tin!"); }
        else setShowModal(true);
      } else { toast.info("Yêu cầu đặt lại mật khẩu đã được gửi!"); setDone(true); }
    } catch (e: any) { toast.error(e.message || "Đã xảy ra lỗi, vui lòng thử lại."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen lg:h-screen grid bg-background text-foreground lg:grid-cols-2">
      <AuthLeftPanel onSuccess={onSuccess} />
      <div className="flex items-start justify-center bg-background p-6 sm:p-12 lg:pt-24 lg:overflow-y-auto">
        <div className="w-full max-w-md relative">
          <div className="mb-6 flex justify-between items-center lg:hidden">
            <button type="button" onClick={onSuccess} className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"><CakeSlice size={16} /> Quay về Trang chủ</button>
          </div>
          {mode !== "forgot" && (
            <div className="mb-8 flex rounded-2xl bg-secondary p-1">
              {(["login", "register"] as AuthMode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${mode === m ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "login" ? AUTH_CONTENT.TABS.LOGIN : AUTH_CONTENT.TABS.REGISTER}
                </button>
              ))}
            </div>
          )}
          {mode === "forgot" && (
            <div>
              <button onClick={() => { setMode("login"); setDone(false); }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">← Quay lại đăng nhập</button>
              <h2 className="text-3xl">Quên mật khẩu</h2>
              <p className="mt-2 text-sm text-muted-foreground">Nhập email — chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
              {done ? (
                <div className="mt-6 rounded-2xl bg-[#eef7ed] p-5 text-sm text-[#355c31]">✓ Email đặt lại mật khẩu đã được gửi.</div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" required placeholder="Email của bạn" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" /></div>
                  <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang gửi…" : "Gửi email đặt lại"}</button>
                </form>
              )}
            </div>
          )}
          {mode === "login" && (
            <div>
              <h2 className="text-3xl">Chào mừng trở lại!</h2>
              <p className="mt-2 text-sm text-muted-foreground">Đăng nhập vào tài khoản Sweet Bean của bạn.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" /></div>
                <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type={showPass ? "text" : "password"} required placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="rounded" /> Ghi nhớ đăng nhập</label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">Quên mật khẩu?</button>
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang đăng nhập…" : "Đăng nhập"}</button>
              </form>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t" /> hoặc đăng nhập với <span className="flex-1 border-t" /></div>
              <div className="mt-4 grid grid-cols-2 gap-3">{AUTH_CONTENT.SOCIAL_PROVIDERS.map(s => (<button key={s} className="rounded-xl border py-2.5 text-sm font-medium hover:bg-secondary transition">{s}</button>))}</div>
            </div>
          )}
          {mode === "register" && (
            <div>
              <h2 className="text-3xl">Tạo tài khoản</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tham gia Sweet Bean để nhận ưu đãi thành viên.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" required placeholder="Họ và tên" value={fullName} onChange={e => { setFullName(e.target.value); if (errors.fullName) setErrors(p => ({ ...p, fullName: undefined })); }} className={`w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary ${errors.fullName ? "border-destructive" : ""}`} /></div>
                  {errors.fullName && <p className="mt-1 text-xs text-destructive pl-3">{errors.fullName}</p>}
                </div>
                <div>
                  <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" required placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }} className={`w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary ${errors.email ? "border-destructive" : ""}`} /></div>
                  {errors.email && <p className="mt-1 text-xs text-destructive pl-3">{errors.email}</p>}
                </div>
                <div>
                  <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="tel" placeholder="Số điện thoại (tuỳ chọn)" value={phone} onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: undefined })); }} className={`w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary ${errors.phone ? "border-destructive" : ""}`} /></div>
                  {errors.phone && <p className="mt-1 text-xs text-destructive pl-3">{errors.phone}</p>}
                </div>
                <div>
                  <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type={showPass ? "text" : "password"} required placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={password} onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }} className={`w-full rounded-xl border bg-input-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary ${errors.password ? "border-destructive" : ""}`} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                  {errors.password && <p className="mt-1 text-xs text-destructive pl-3">{errors.password}</p>}
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" required className="mt-1 rounded shrink-0 accent-primary" />
                  <span>Tôi đồng ý với{" "}<span className="text-primary hover:underline font-semibold">Điều khoản dịch vụ</span>{" và "}<span className="text-primary hover:underline font-semibold">Chính sách bảo mật</span>.</span>
                </label>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</button>
              </form>
            </div>
          )}
        </div>
      </div>
      {showModal && <RegisterModal loading={loading} fillDetailsLater={fillDetailsLater} setFillDetailsLater={setFillDetailsLater} onCancel={() => setShowModal(false)} onConfirm={handleConfirmRegister} />}
    </div>
  );
}
