import { useState, useEffect } from "react";
import { CakeSlice, Eye, EyeOff, Mail, Lock, User, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { AUTH_CONTENT } from "../../constants/authContent";
import { env } from "../../config/env";
import { policyContentMap } from "../pages/PolicyPage";
import type { AuthMode, AuthErrors } from "./authUtils";
import { validateRegisterFields, apiRegister, getAuthErrorMessage } from "./authUtils";

declare global {
  interface Window {
    google?: any;
    googleInitialized?: boolean;
  }
}

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

export function AuthPage({ onSuccess, initialMode = "login", resetToken = "", setView }: { onSuccess: () => void; onAdminDemo?: () => void; initialMode?: AuthMode; resetToken?: string; setView?: (view: string) => void; }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPolicy, setShowPolicy] = useState<"privacy" | "terms" | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});

  const switchMode = (m: AuthMode) => {
    setMode(m); setEmail(m === "login" ? "" : "");
    setPassword(""); setPhone(""); setFullName(""); setErrors({});
  };

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getAuthErrorMessage(data.message, "Đăng nhập Google thất bại"));

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Đăng nhập bằng Google thành công!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Đã xảy ra lỗi khi đăng nhập bằng Google.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      if (!window.googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: env.GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.googleInitialized = true;
      }

      const btn = document.getElementById("google-signin-btn");
      if (btn) {
        window.google.accounts.id.renderButton(
          btn,
          { theme: "outline", size: "large", width: 380, shape: "pill" },
        );
      }
    }
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErrors({});
    try {
      if (mode === "login") {
        setLoading(true);
        const res = await fetch(`${env.API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(getAuthErrorMessage(data.message, "Đăng nhập thất bại"));
        localStorage.setItem("accessToken", data.accessToken); localStorage.setItem("refreshToken", data.refreshToken); localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Đăng nhập thành công!"); onSuccess();
      } else if (mode === "register") {
        const err = validateRegisterFields(fullName, email, phone, password);
        if (Object.keys(err).length) { setErrors(err); toast.error("Vui lòng kiểm tra lại thông tin!"); }
        else {
          setLoading(true);
          const registerErr = await apiRegister(fullName, email, phone || undefined, password, onSuccess, setMode);
          if (registerErr) setErrors(registerErr);
        }
      } else if (mode === "forgot") {
        setLoading(true);
        const res = await fetch(`${env.API_URL}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Yêu cầu đặt lại mật khẩu thất bại");
        toast.success(data.message || "Email đặt lại mật khẩu đã được gửi!");
        setDone(true);
      } else if (mode === "reset") {
        if (password.length < 6) {
          toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự!");
          return;
        }
        setLoading(true);
        const res = await fetch(`${env.API_URL}/auth/reset-password?token=${resetToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Đặt lại mật khẩu thất bại");
        toast.success(data.message || "Mật khẩu đã được đặt lại thành công!");
        setMode("login");
        setEmail("");
        setPassword("");
      }
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
          {mode !== "forgot" && mode !== "reset" && (
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
              <p className="mt-2 text-sm text-muted-foreground">Nhập email - chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
              {done ? (
                <div className="mt-6 rounded-2xl bg-[#eef7ed] p-5 text-sm text-[#355c31]">✓ Email đặt lại mật khẩu đã được gửi.</div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="email" required placeholder="Email của bạn" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" /></div>
                  <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang gửi..." : "Gửi email đặt lại"}</button>
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
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
              </form>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t" /> hoặc đăng nhập bằng <span className="flex-1 border-t" /></div>
              <div className="mt-4 flex justify-center">
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]"></div>
              </div>
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
                  <span>Tôi đồng ý với{" "}
                    <button type="button" onClick={() => setShowPolicy("terms")} className="text-primary hover:underline font-semibold bg-transparent border-0 p-0">Điều khoản dịch vụ</button>
                    {" và "}
                    <button type="button" onClick={() => setShowPolicy("privacy")} className="text-primary hover:underline font-semibold bg-transparent border-0 p-0">Chính sách bảo mật</button>.
                  </span>
                </label>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</button>
              </form>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t" /> hoặc đăng ký bằng <span className="flex-1 border-t" /></div>
              <div className="mt-4 flex justify-center">
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]"></div>
              </div>
            </div>
          )}
          {mode === "reset" && (
            <div>
              <h2 className="text-3xl">Đặt lại mật khẩu</h2>
              <p className="mt-2 text-sm text-muted-foreground">Nhập mật khẩu mới của bạn bên dưới.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">
                  {loading ? "Đang xử lý..." : "Xác nhận mật khẩu mới"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Policy Modal Overlay */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold font-serif">{policyContentMap[showPolicy].title}</h2>
              <button type="button" onClick={() => setShowPolicy(null)} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {policyContentMap[showPolicy].content}
            </div>
            <div className="border-t p-4 flex justify-end">
              <button type="button" onClick={() => setShowPolicy(null)} className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
