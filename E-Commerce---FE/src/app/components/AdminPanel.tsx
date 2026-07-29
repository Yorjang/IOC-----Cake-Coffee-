import {
  BarChart2,
  Boxes,
  Image,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  PanelLeftClose, PanelLeftOpen,
  Settings, ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

import { AdminBanners } from './admin/AdminBanners';
import { AdminBranches } from './admin/AdminBranches';
import { AdminCategories } from './admin/AdminCategories';
import { AdminInventory } from './admin/AdminInventory';
import { AdminOrders } from './admin/AdminOrders';
import { AdminProducts } from './admin/AdminProducts';
import { AdminProductTags } from './admin/AdminProductTags';
import { AdminRevenue } from './admin/AdminRevenue';
import { AdminReviews } from './admin/AdminReviews';
import { AdminSettings } from './admin/AdminSettings';
import { AdminStoreMap } from './admin/AdminStoreMap';
import { AdminUsers } from './admin/AdminUsers';
import { AdminVouchers } from './admin/AdminVouchers';
import { Dashboard } from './admin/Dashboard';

type AdminRole = "admin" | "store_manager" | "staff" | "cashier";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Quản trị viên",
  store_manager: "Quản lý cửa hàng",
  staff: "Nhân viên",
  cashier: "Thu ngân",
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBag, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "branches", label: "Chi nhánh", icon: Store, allowedRoles: ["admin", "store_manager"] },
  { key: "storeMap", label: "Bản đồ", icon: MapPin, allowedRoles: ["admin", "store_manager"] },
  { key: "products", label: "Sản phẩm", icon: Package, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "categories", label: "Danh mục", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "productTags", label: "Tag sản phẩm", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "inventory", label: "Tồn kho", icon: Boxes, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "users", label: "Người dùng", icon: Users, allowedRoles: ["admin"] },
  { key: "reviews", label: "Đánh giá", icon: Star, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "vouchers", label: "Voucher", icon: Tag, allowedRoles: ["admin", "store_manager"] },
  { key: "banners", label: "Banner", icon: Image, allowedRoles: ["admin", "store_manager"] },
  { key: "revenue", label: "Thống kê", icon: BarChart2, allowedRoles: ["admin", "store_manager"] },
  { key: "settings", label: "Cài đặt", icon: Settings, allowedRoles: ["admin"] },
] satisfies Array<{
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  allowedRoles: AdminRole[];
}>;

const ADMIN_TAB_PATHS: Record<string, string> = {
  dashboard: "/admin/dashboard",
  orders: "/admin/orders",
  branches: "/admin/branches",
  storeMap: "/admin/map",
  products: "/admin/products",
  categories: "/admin/categories",
  productTags: "/admin/tags",
  inventory: "/admin/inventory",
  users: "/admin/users",
  reviews: "/admin/reviews",
  vouchers: "/admin/vouchers",
  banners: "/admin/banners",
  revenue: "/admin/statistics",
  settings: "/admin/settings",
};

const ADMIN_PATH_TABS: Record<string, string> = Object.fromEntries(
  Object.entries(ADMIN_TAB_PATHS).map(([tab, path]) => [path, tab]),
);

export function AdminPanel({ onExit, adminUser }: { onExit: () => void; adminUser?: any }) {
  const role = (adminUser?.role ?? "admin") as AdminRole;
  const visibleNav = navItems.filter(item => item.allowedRoles.includes(role));
  const getTabFromPath = () => {
    const requestedTab = window.location.pathname === "/admin"
      ? "dashboard"
      : ADMIN_PATH_TABS[window.location.pathname];
    return visibleNav.some(item => item.key === requestedTab)
      ? requestedTab
      : visibleNav[0]?.key ?? "dashboard";
  };
  const [active, setActive] = useState(getTabFromPath);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sb_admin_sidebar_collapsed") === "true");

  useEffect(() => {
    const syncTabWithPath = () => {
      const nextTab = getTabFromPath();
      if (window.location.pathname === "/admin") {
        window.history.replaceState(null, "", ADMIN_TAB_PATHS[nextTab] ?? "/admin/dashboard");
      }
      setActive(nextTab);
      setMobileNav(false);
    };
    syncTabWithPath();
    const handlePopState = () => syncTabWithPath();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [role]);

  const selectTab = (key: string) => {
    setActive(key);
    setMobileNav(false);
    const targetPath = ADMIN_TAB_PATHS[key] ?? "/admin/dashboard";
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(previous => {
      const next = !previous;
      localStorage.setItem("sb_admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  const content: Record<string, any> = {
    dashboard: <Dashboard />,
    orders: <AdminOrders />,
    branches: <AdminBranches adminUser={adminUser} />,
    storeMap: <AdminStoreMap />,
    products: <AdminProducts />,
    categories: <AdminCategories />,
    productTags: <AdminProductTags />,
    inventory: <AdminInventory />,
    users: <AdminUsers />,
    reviews: <AdminReviews />,
    vouchers: <AdminVouchers />,
    banners: <AdminBanners />,
    revenue: <AdminRevenue />,
    settings: <AdminSettings />,
  };

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      {/* Admin top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sidebar-accent bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNav(previous => !previous)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground lg:hidden"
            aria-label={mobileNav ? "Đóng menu quản trị" : "Mở menu quản trị"}
            title={mobileNav ? "Đóng menu" : "Mở menu"}
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground lg:inline-flex"
            aria-label={sidebarCollapsed ? "Mở rộng menu quản trị" : "Thu gọn menu quản trị"}
            title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <span className="font-serif text-lg font-bold text-primary">Sweet Bean Admin</span>
          {adminUser && (
            <span className="hidden sm:flex items-center gap-2 rounded-full border border-sidebar-accent bg-sidebar/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-400" />
              {adminUser.fullName || adminUser.email}
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">{ROLE_LABEL[role] ?? role}</span>
            </span>
          )}
        </div>
        <button onClick={onExit} className="rounded-full bg-sidebar px-4 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
          Đăng xuất
        </button>
      </header>

      {mobileNav && (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setMobileNav(false)}
          className="fixed inset-0 top-[61px] z-20 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <div className={`grid w-full min-w-0 gap-0 transition-[grid-template-columns] duration-300 ${sidebarCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[220px_minmax(0,1fr)]"}`}>
        {/* Sidebar */}
        <aside className={`${mobileNav ? "flex" : "hidden"} fixed bottom-0 left-0 top-[61px] z-30 w-[280px] flex-col overflow-y-auto border-r border-sidebar-accent bg-sidebar p-4 shadow-2xl transition-[width,padding] duration-300 lg:sticky lg:top-[61px] lg:z-auto lg:flex lg:h-[calc(100vh-61px)] lg:w-auto lg:shadow-none ${sidebarCollapsed ? "lg:px-2" : "lg:px-4"}`}>
          <nav className="flex-1 space-y-1">
            {visibleNav.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => selectTab(key)}
                title={sidebarCollapsed ? label : undefined}
                aria-label={label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""} ${active === key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-sidebar-accent"}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{label}</span>
              </button>
            ))}
          </nav>
          <div className={`mt-6 rounded-xl border border-sidebar-accent bg-background/40 p-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Vai trò</p>
            <p className="text-xs font-semibold text-foreground">{ROLE_LABEL[role] ?? role}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {role === "admin" && "Toàn quyền quản lý hệ thống."}
              {role === "store_manager" && "Quản lý vận hành, sản phẩm, kho và doanh thu."}
              {role === "staff" && "Xử lý sản phẩm, tồn kho, đơn hàng và đánh giá."}
              {role === "cashier" && "Theo dõi dashboard và xử lý đơn hàng."}
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 w-full p-5 lg:p-7">
          {content[active]}
        </main>
      </div>
    </div>
  );
}
