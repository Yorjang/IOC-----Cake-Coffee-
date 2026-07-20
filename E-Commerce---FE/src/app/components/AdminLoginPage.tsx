import { parseRes } from '../../utils/api';
import { useState } from "react";
import { Lock, Mail, CakeSlice, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { saveAuthSession } from "./authSession";

const ADMIN_ROLES = ["admin", "staff", "cashier", "store_manager"];

interface Props {
  onSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

export function AdminLoginPage({ onSuccess, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseRes(res);
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");

      const role = data.user?.role;
      if (!ADMIN_ROLES.includes(role)) {
        toast.error("Tài khoản không có quyền truy cập trang quản trị.");
        return;
      }

      saveAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      }, true);
      toast.success(`Xin chào, ${data.user?.fullName || "Admin"}!`);
      onSuccess(data.user, data.accessToken);
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const ROLE_LABEL: Record<string, string> = {
    admin: "Quản trị viên",
    store_manager: "Quản lý cửa hàng",
    staff: "Nhân viên",
    cashier: "Thu ngân",
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <CakeSlice size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sweet Bean Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hệ thống quản trị nội bộ</p>
        </div>

        {/* Access notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-yellow-600" />
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Khu vực dành riêng cho <strong>quản trị viên, quản lý và nhân viên</strong>. Mọi hành động đều được ghi lại.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-background p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Đăng nhập quản trị</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email" required placeholder="Email tài khoản nội bộ" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-input py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? "text" : "password"} required placeholder="Mật khẩu" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-input py-3 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? "Đang xác thực..." : "Đăng nhập"}
            </button>
          </form>

          {/* Role legend */}
          <div className="mt-6 border-t pt-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Quyền truy cập</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_LABEL).map(([role, label]) => (
                <div key={role} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button" onClick={onBack}
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Quay về trang khách hàng
        </button>
      </div>
    </div>
  );
}
