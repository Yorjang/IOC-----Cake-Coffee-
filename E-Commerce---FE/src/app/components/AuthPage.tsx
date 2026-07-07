import { useState } from "react";
import { CakeSlice, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { AUTH_CONTENT } from "../../constants/authContent";

export function AuthPage({ onSuccess, onAdminDemo }: { onSuccess: () => void; onAdminDemo?: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); if (mode === "forgot") { setDone(true); } else { onSuccess(); } }, AUTH_CONTENT.SUBMIT_DELAY_MS);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid bg-background text-foreground lg:grid-cols-2">
      {/* Left – decorative panel */}
      <div className="relative hidden overflow-hidden border-r bg-sidebar lg:block">
        <img
          src={AUTH_CONTENT.HERO_IMAGE}
          alt={AUTH_CONTENT.HERO_IMAGE_ALT}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/90 via-sidebar/65 to-sidebar/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary-foreground/20">
              <CakeSlice size={20} className="text-primary-foreground" />
            </span>
            <span className="font-serif text-2xl font-bold text-primary-foreground">{AUTH_CONTENT.BRAND_NAME}</span>
          </div>
          <div>
            <h1 className="text-5xl text-primary-foreground">{AUTH_CONTENT.HERO_TITLE}</h1>
            <p className="mt-4 text-lg text-primary-foreground/70">{AUTH_CONTENT.HERO_SUBTITLE}</p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {AUTH_CONTENT.HERO_FEATURES.map(t => (
                <div key={t} className="rounded-2xl bg-primary-foreground/10 p-4 text-sm text-primary-foreground/80">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex items-center justify-center bg-background p-4 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {/* Tabs */}
          {mode !== "forgot" && (
            <div className="mb-8 flex rounded-2xl bg-secondary p-1">
              {(["login", "register"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${mode === m ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {m === "login" ? AUTH_CONTENT.TABS.LOGIN : AUTH_CONTENT.TABS.REGISTER}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" ? (
            <div>
              <button onClick={() => { setMode("login"); setDone(false); }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">← Quay lại đăng nhập</button>
              <h2 className="text-3xl">Quên mật khẩu</h2>
              <p className="mt-2 text-sm text-muted-foreground">Nhập email — chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
              {done ? (
                <div className="mt-6 rounded-2xl bg-[#eef7ed] p-5 text-sm text-[#355c31]">
                  ✓ Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required placeholder="Email của bạn" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">
                    {loading ? "Đang gửi…" : "Gửi email đặt lại"}
                  </button>
                </form>
              )}
            </div>
          ) : mode === "login" ? (
            <div>
              <h2 className="text-3xl">Chào mừng trở lại!</h2>
              <p className="mt-2 text-sm text-muted-foreground">Đăng nhập vào tài khoản Sweet Bean của bạn.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required placeholder="Email" defaultValue="minhanh@email.com" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? "text" : "password"} required placeholder="Mật khẩu" defaultValue="••••••••" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="rounded" /> Ghi nhớ đăng nhập</label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">Quên mật khẩu?</button>
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">
                  {loading ? "Đang đăng nhập…" : "Đăng nhập"}
                </button>
              </form>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex-1 border-t" /> hoặc đăng nhập với <span className="flex-1 border-t" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {AUTH_CONTENT.SOCIAL_PROVIDERS.map(s => (
                  <button key={s} className="rounded-xl border py-2.5 text-sm font-medium hover:bg-secondary transition">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl">Tạo tài khoản</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tham gia Sweet Bean để nhận ưu đãi thành viên.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" required placeholder="Họ và tên" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required placeholder="Email" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" placeholder="Số điện thoại (tuỳ chọn)" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? "text" : "password"} required placeholder="Mật khẩu (tối thiểu 8 ký tự)" className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" required className="mt-1 rounded shrink-0" />
                  Tôi đồng ý với <span className="text-primary cursor-pointer hover:underline mx-1">Điều khoản dịch vụ</span> và <span className="text-primary cursor-pointer hover:underline ml-1">Chính sách bảo mật</span>.
                </label>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50">
                  {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
                </button>
              </form>
            </div>
          )}
          {onAdminDemo && (
            <button
              type="button"
              onClick={onAdminDemo}
              className="mt-5 w-full rounded-full border border-primary/30 bg-secondary py-3 text-sm font-semibold text-primary transition hover:bg-accent"
            >
              {AUTH_CONTENT.DEMO_ADMIN_LABEL}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
