import React, { useState } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search,
  DollarSign, ChevronDown
} from "lucide-react";

import { categories, options, orders, products, reviews, users, vouchers } from "../../data/adminMockData";
import { StatusBadge, AdminBtn, TableHeader } from "./admin/AdminShared";
import { Dashboard } from "./admin/AdminDashboard";
import { AdminRevenue } from "./admin/AdminRevenue";
import { AdminBanners, AdminSettings } from "./admin/AdminBannersSettings";

// ── Products ──────────────────────────────────────────────────────────────────
function AdminProducts() {
  const [search, setSearch] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý sản phẩm</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm sản phẩm</span></AdminBtn>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground" placeholder="Tìm sản phẩm…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none"><option>Tất cả danh mục</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Sản phẩm", "Danh mục", "Giá", "Tồn kho", "Trạng thái", "Thao tác"]} />
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 pr-4"><div className="flex items-center gap-3"><img src={p.img} alt={p.name} className="size-10 rounded-lg object-cover" /><span className="text-foreground">{p.name}</span></div></td>
                <td className="py-3 text-muted-foreground">{p.cat}</td>
                <td className="py-3 font-semibold text-primary">{p.price}</td>
                <td className="py-3 text-muted-foreground">{p.stock === 999 ? "∞" : p.stock}</td>
                <td className="py-3"><StatusBadge status={p.status} /></td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Eye size={14} /></AdminBtn><AdminBtn variant="ghost"><Edit size={14} /></AdminBtn><AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function AdminCategories() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý danh mục</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm danh mục</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "Tên danh mục", "Slug", "Số sản phẩm", "Trạng thái", "Thao tác"]} />
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{c.id}</td>
                <td className="py-3 font-medium text-foreground">{c.name}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="py-3 text-muted-foreground">{c.count}</td>
                <td className="py-3"><StatusBadge status={c.status} /></td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Edit size={14} /></AdminBtn><AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [filter, setFilter] = useState("Tất cả");
  const tabs = ["Tất cả", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành", "Huỷ"];
  const filtered = filter === "Tất cả" ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-40" placeholder="Tìm đơn #SB…" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (<button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1.5 text-sm transition ${filter === t ? "bg-primary text-primary-foreground" : "bg-sidebar text-muted-foreground hover:bg-sidebar-accent"}`}>{t}</button>))}
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã đơn", "Khách hàng", "Sản phẩm", "Tổng tiền", "Giờ", "Trạng thái", "Thao tác"]} />
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono text-xs text-primary">{o.id}</td>
                <td className="py-3 text-foreground">{o.customer}</td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">{o.items}</td>
                <td className="py-3 font-semibold text-foreground">{o.total}</td>
                <td className="py-3 text-muted-foreground">{o.time}</td>
                <td className="py-3"><StatusBadge status={o.status} /></td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Eye size={14} /></AdminBtn><AdminBtn variant="ghost"><Edit size={14} /></AdminBtn></div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Không có đơn hàng nào trong trạng thái này.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function AdminUsers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý người dùng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-44" placeholder="Tìm tên, email…" /></div>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "Họ tên", "Email", "SĐT", "Đơn hàng", "Tổng chi", "Tham gia", "Phân loại", "Thao tác"]} />
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{u.id}</td>
                <td className="py-3 font-medium text-foreground">{u.name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3 text-muted-foreground">{u.phone}</td>
                <td className="py-3 text-center text-muted-foreground">{u.orders}</td>
                <td className="py-3 text-primary font-medium">{u.total}</td>
                <td className="py-3 text-muted-foreground">{u.joined}</td>
                <td className="py-3"><StatusBadge status={u.status} /></td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Eye size={14} /></AdminBtn><AdminBtn variant="danger"><XCircle size={14} /></AdminBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function AdminReviews() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đánh giá</h2>
        <span className="rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">2 chờ duyệt</span>
      </div>
      <div className="grid gap-4">
        {reviews.map(r => (
          <div key={r.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-primary text-xs font-bold">{r.user[0]}</div>
                  <div><p className="font-medium text-foreground">{r.user}</p><p className="text-xs text-muted-foreground">{r.date} · {r.product}</p></div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={14} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-sidebar-accent"} />))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                <div className="flex gap-2 mt-1">
                  {r.status === "Chờ duyệt" && <AdminBtn><CheckCircle size={14} /></AdminBtn>}
                  <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                  <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Vouchers ──────────────────────────────────────────────────────────────────
function AdminVouchers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý voucher</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Tạo voucher</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã", "Kiểu", "Giá trị", "Đơn tối thiểu", "Đã dùng", "Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
          <tbody>
            {vouchers.map(v => (
              <tr key={v.code} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                <td className="py-3 text-muted-foreground">{v.type}</td>
                <td className="py-3 font-semibold text-foreground">{v.value}</td>
                <td className="py-3 text-muted-foreground">{v.min}</td>
                <td className="py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-sidebar-accent"><div className="h-full rounded-full bg-primary" style={{ width: `${(v.used / v.limit) * 100}%` }} /></div><span className="text-muted-foreground">{v.used}/{v.limit}</span></div></td>
                <td className="py-3 text-muted-foreground">{v.limit}</td>
                <td className="py-3 text-muted-foreground">{v.expiry}</td>
                <td className="py-3"><StatusBadge status={v.status} /></td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Edit size={14} /></AdminBtn><AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// AdminBanners → see ./admin/AdminBannersSettings.tsx

// ── Options ───────────────────────────────────────────────────────────────────
function AdminOptions() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý tùy chọn sản phẩm</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm tùy chọn</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "Tên tùy chọn", "Kiểu", "Giá trị", "Áp dụng cho", "Thao tác"]} />
          <tbody>
            {options.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{o.id}</td>
                <td className="py-3 font-medium text-foreground">{o.name}</td>
                <td className="py-3"><span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs text-primary">{o.type}</span></td>
                <td className="py-3 text-muted-foreground">{o.values}</td>
                <td className="py-3 text-xs text-muted-foreground">{o.applies}</td>
                <td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost"><Edit size={14} /></AdminBtn><AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// AdminSettings → see ./admin/AdminBannersSettings.tsx

// ── Role permission matrix ────────────────────────────────────────────────────
// admin        → full access
// store_manager → no users, no system settings
// staff        → products, categories, orders, reviews
// cashier      → dashboard + orders only
type AdminRole = "admin" | "store_manager" | "staff" | "cashier";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Quản trị viên",
  store_manager: "Quản lý cửa hàng",
  staff: "Nhân viên",
  cashier: "Thu ngân",
};

const navItems = [
  { key: "dashboard",  label: "Dashboard",    icon: LayoutDashboard, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "orders",     label: "Đơn hàng",     icon: ShoppingBag,    allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "products",   label: "Sản phẩm",     icon: Package,         allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "categories", label: "Danh mục",     icon: Tag,             allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "reviews",    label: "Đánh giá",     icon: Star,            allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "options",    label: "Tùy chọn SP",  icon: Settings,        allowedRoles: ["admin", "store_manager"] },
  { key: "vouchers",   label: "Voucher",      icon: Tag,             allowedRoles: ["admin", "store_manager"] },
  { key: "banners",    label: "Banner",       icon: Image,           allowedRoles: ["admin", "store_manager"] },
  { key: "revenue",    label: "Thống kê",     icon: BarChart2,       allowedRoles: ["admin", "store_manager"] },
  { key: "users",      label: "Người dùng",   icon: Users,           allowedRoles: ["admin"] },
  { key: "settings",   label: "Cài đặt",      icon: Settings,        allowedRoles: ["admin"] },
];

export function AdminPanel({ onExit, adminUser }: { onExit: () => void; adminUser?: any }) {
  const role = (adminUser?.role ?? "staff") as AdminRole;
  const visibleNav = navItems.filter(item => item.allowedRoles.includes(role));
  const [active, setActive] = useState(visibleNav[0]?.key ?? "dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  const content: Record<string, React.ReactElement> = {
    dashboard:  <Dashboard />,
    products:   <AdminProducts />,
    categories: <AdminCategories />,
    options:    <AdminOptions />,
    orders:     <AdminOrders />,
    users:      <AdminUsers />,
    reviews:    <AdminReviews />,
    vouchers:   <AdminVouchers />,
    banners:    <AdminBanners />,
    revenue:    <AdminRevenue />,
    settings:   <AdminSettings />,
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sidebar-accent bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setMobileNav(!mobileNav)}>
            <ChevronDown size={20} className={`transition ${mobileNav ? "rotate-180" : ""}`} />
          </button>
          <span className="font-serif text-lg font-bold text-primary">Sweet Bean Admin</span>
          {adminUser && (
            <span className="hidden sm:flex items-center gap-2 rounded-full border border-sidebar-accent bg-sidebar/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-400" />
              {adminUser.fullName || adminUser.email}
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">{adminUser.role}</span>
            </span>
          )}
        </div>
        <button onClick={onExit} className="rounded-full bg-sidebar px-4 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition">Đăng xuất</button>
      </header>
      <div className="mx-auto grid max-w-screen-xl gap-0 lg:grid-cols-[220px_1fr]">
        <aside className={`${mobileNav ? "block" : "hidden"} lg:flex lg:flex-col bg-sidebar border-r border-sidebar-accent min-h-screen p-4`}>
          <nav className="flex-1 space-y-1">
            {visibleNav.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setActive(key); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active === key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-sidebar-accent"}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
          {/* Role info at bottom of sidebar */}
          <div className="mt-6 rounded-xl border border-sidebar-accent bg-background/40 p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Vai trò</p>
            <p className="text-xs font-semibold text-foreground">{ROLE_LABEL[role] ?? role}</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {role === "admin" && "Toàn quyền quản lý hệ thống"}
              {role === "store_manager" && "Quản lý cửa hàng, sản phẩm và doanh thu"}
              {role === "staff" && "Xử lý đơn hàng và sản phẩm"}
              {role === "cashier" && "Xử lý đơn hàng và thanh toán"}
            </p>
          </div>
        </aside>
        <main className="p-5 lg:p-7">{content[active]}</main>
      </div>
    </div>
  );
}
