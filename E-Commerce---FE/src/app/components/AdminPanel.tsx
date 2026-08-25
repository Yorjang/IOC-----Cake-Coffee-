import {
  Award,
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
import { AdminCombos } from './admin/AdminCombos';
import { AdminInventory } from './admin/AdminInventory';
import { AdminLoyalty } from './admin/AdminLoyalty';
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
  { key: "combos", label: "Combo", icon: Package, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "categories", label: "Danh mục", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "productTags", label: "Tag sản phẩm", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "inventory", label: "Tồn kho", icon: Boxes, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "users", label: "Người dùng", icon: Users, allowedRoles: ["admin"] },
  { key: "loyalty", label: "Hạng thành viên", icon: Award, allowedRoles: ["admin", "store_manager"] },
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
  combos: "/admin/combos",
  categories: "/admin/categories",
  productTags: "/admin/tags",
  inventory: "/admin/inventory",
  users: "/admin/users",
  loyalty: "/admin/loyalty",
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
    combos: <AdminCombos />,
    categories: <AdminCategories />,
    productTags: <AdminProductTags />,
    inventory: <AdminInventory />,
    users: <AdminUsers />,
    loyalty: <AdminLoyalty />,
    reviews: <AdminReviews />,
    vouchers: <AdminVouchers />,
    banners: <AdminBanners />,
    revenue: <AdminRevenue />,
    settings: <AdminSettings />,
  };

  return (
    <div className="admin-theme flex h-screen w-full overflow-hidden bg-[#F5F7FB] text-foreground">
      {/* Mobile Backdrop */}
      {mobileNav && (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setMobileNav(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Sidebar (Full Height Left) */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#222E3C] text-white shadow-xl transition-all duration-300 lg:static lg:z-auto ${mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${sidebarCollapsed ? "w-[72px]" : "w-[260px]"}`}>
        {/* Sidebar Header / Brand */}
        <div className="flex h-[60px] shrink-0 items-center justify-center border-b border-white/10 px-4">
          {sidebarCollapsed ? (
            <span className="font-serif text-xl font-bold text-white">SB</span>
          ) : (
            <span className="font-serif text-xl font-bold text-white">Sweet Bean <span className="rounded bg-blue-500/20 px-1 text-sm text-blue-400">PRO</span></span>
          )}
        </div>

        {/* User Profile Area (AdminKit Style) */}
        {!sidebarCollapsed && adminUser && (
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
              {adminUser.fullName ? adminUser.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{adminUser.fullName || adminUser.email}</p>
              <p className="truncate text-[11px] text-white/60">{ROLE_LABEL[role] ?? role}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className={`mb-3 ml-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 ${sidebarCollapsed ? "text-center ml-0" : ""}`}>
            {sidebarCollapsed ? "..." : "Pages"}
          </p>
          <nav className="space-y-1">
            {visibleNav.map(({ key, label, icon: Icon }) => {
              const isActive = active === key;
              return (
                <button
                  key={key}
                  onClick={() => selectTab(key)}
                  title={sidebarCollapsed ? label : undefined}
                  aria-label={label}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                    sidebarCollapsed ? "justify-center" : ""
                  } ${isActive ? "bg-white/10 text-white font-medium border-l-4 border-l-blue-500" : "text-white/60 hover:bg-white/5 hover:text-white border-l-4 border-l-transparent"}`}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? "text-blue-400" : "text-white/60 group-hover:text-white"}`} />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area (Right Side) */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted lg:hidden"
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted lg:inline-flex"
            >
              <Menu size={20} />
            </button>
            
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <span className="font-medium text-foreground">Analytics</span>
              <span className="text-border">/</span>
              <span>Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <button onClick={onExit} className="rounded bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted-foreground/10 transition">
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {content[active]}
        </main>
      </div>
    </div>
  );
}
