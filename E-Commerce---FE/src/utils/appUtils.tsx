import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { VIEW_KEYS } from '../config/appConfig';
import { type StoreLocation } from '../data/storeLocations';
import { getDiscountedPrice } from '../app/components/shared';
import { LoadingScreen } from '../app/components/LoadingScreen';
import { Toaster } from '../app/components/ui/sonner';

export const matchSize = (itemSize: string, targetSize: string): boolean => {
  if (!targetSize) return true;
  if (!itemSize) return false;

  const cleanItem = itemSize.toLowerCase().trim();
  const cleanTarget = targetSize.toLowerCase().trim();

  return cleanItem === cleanTarget || cleanItem.startsWith(cleanTarget);
};

// Array format: [name, price, categoryName, imageUrl, rating, badge, discountPrice, bestCouponCode]
export const apiProductToArray = (p: any, coupons: any[] = []): any[] => {
  const activeVariants = (p.variants || [])
    .filter((variant: any) => variant.status === "active")
    .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  const originalPrice = activeVariants[0]?.price ? Number(activeVariants[0].price) : 0;
  const price = originalPrice ? `${originalPrice.toLocaleString("vi-VN")}đ` : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rawRating = p.averageRating !== undefined && p.averageRating !== null ? p.averageRating : p.rating;
  const rating = rawRating ? String(Number(rawRating).toFixed(1)) : "5.0";
  const badge = p.productType === "combo"
    ? "Combo"
    : activeVariants.length > 1
      ? `${activeVariants.length} kích cỡ`
      : activeVariants.length === 1 ? "Còn hàng" : "Hết hàng";

  let sizeStr = activeVariants[0]?.size || "Vừa";
  if (sizeStr.includes("(")) {
    sizeStr = sizeStr.split("(")[0].trim();
  }

  const { discountedPrice, discountAmount, bestCoupon } = getDiscountedPrice(originalPrice, p, coupons, sizeStr);
  const discountPriceStr = discountAmount > 0 ? `${discountedPrice.toLocaleString("vi-VN")}đ` : null;

  const arr = [p.name, price, categoryName, imageUrl, rating, badge, discountPriceStr, bestCoupon?.code];
  (arr as any).raw = p;
  return arr;
};



export const apiCategoryToLegacy = (c: any) => ({
  id: c.id,
  parentId: c.parentId ?? null,
  name: c.name,
  icon: "",
  img: c.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format",
  sortOrder: c.sortOrder ?? 0,
  isActive: c.isActive !== false,
});

export const VIEW_PATH_MAP: Record<string, string> = {
  [VIEW_KEYS.HOME]: "/",
  [VIEW_KEYS.SWEETS]: "/banh-ngot",
  [VIEW_KEYS.DRINKS]: "/do-uong",
  [VIEW_KEYS.COMBO]: "/combo",
  [VIEW_KEYS.CART]: "/gio-hang",
  [VIEW_KEYS.CHECKOUT]: "/thanh-toan",
  [VIEW_KEYS.SUCCESS]: "/thanh-cong",
  [VIEW_KEYS.DETAIL]: "/chi-tiet",
  [VIEW_KEYS.ADMIN]: "/admin",
  [VIEW_KEYS.STAFF]: "/nhan-vien",
  [VIEW_KEYS.LOGIN]: "/dang-nhap",
  [VIEW_KEYS.REGISTER]: "/dang-ky",
  [VIEW_KEYS.FORGOT_PASSWORD]: "/quen-mat-khau",
  [VIEW_KEYS.FAVORITES]: "/yeu-thich",
  [VIEW_KEYS.PROFILE]: "/ho-so",
  [VIEW_KEYS.RESET_PASSWORD]: "/reset-password",
  [VIEW_KEYS.STORES]: "/he-thong-cua-hang",
  [VIEW_KEYS.PRIVACY]: "/chinh-sach-bao-mat",
  [VIEW_KEYS.TERMS]: "/dieu-khoan-dich-vu",
  [VIEW_KEYS.RETURN_POLICY]: "/chinh-sach-doi-tra",
  [VIEW_KEYS.ORDER_GUIDE]: "/huong-dan-dat-banh",
  [VIEW_KEYS.TRACKING]: "/theo-doi",
  [VIEW_KEYS.PAYMENT]: "/thanh-toan-don-hang",
};

export const getPathFromView = (view: string, product?: any, entityId?: string) => {
  if (view === VIEW_KEYS.DETAIL && product) {
    return `/chi-tiet/${encodeURIComponent(product[0].toLowerCase().replace(/\s+/g, "-"))}`;
  }
  if (view === VIEW_KEYS.PAYMENT && entityId) return `/thanh-toan-don-hang/${entityId}`;
  return VIEW_PATH_MAP[view] ?? `/danh-muc/${encodeURIComponent(view.toLowerCase().replace(/\s+/g, "-"))}`;
};

export const getViewFromPath = (path: string, cats: any[] = []) => {
  if (path.startsWith("/admin")) return VIEW_KEYS.ADMIN;
  if (path.startsWith('/thanh-toan-don-hang/')) return VIEW_KEYS.PAYMENT;
  if (path.startsWith('/ho-so')) return VIEW_KEYS.PROFILE;
  for (const [key, value] of Object.entries(VIEW_PATH_MAP)) {
    if (value === path) return key;
  }
  if (path.startsWith("/chi-tiet/")) return VIEW_KEYS.DETAIL;
  if (path.startsWith("/danh-muc/")) {
    const slug = decodeURIComponent(path.replace("/danh-muc/", ""));
    const found = cats.find(c => (c.name || c).toLowerCase().replace(/\s+/g, "-") === slug);
    if (found) return found.name || found;
    if (slug === "ca-phe" || slug === "cà-phê" || slug === "cafe") return "Cà phê";
    if (slug === "banh-ngot") return VIEW_KEYS.SWEETS;
    if (slug === "do-uong" || slug === "cafe-do-uong") return VIEW_KEYS.DRINKS;
    if (slug === "combo") return VIEW_KEYS.COMBO;
    if (slug === "tat-ca-san-pham" || slug === "tat-ca") return VIEW_KEYS.ALL_PRODUCTS;
    return VIEW_KEYS.SWEETS;
  }
  return VIEW_KEYS.HOME;
};

export const getOrderIdFromPath = (path: string): string | null => {
  if (!path.startsWith('/thanh-toan-don-hang/')) return null;
  return decodeURIComponent(path.slice('/thanh-toan-don-hang/'.length)) || null;
};

export const getProductFromPath = (path: string, prods: any[] = []) => {
  if (!path.startsWith("/chi-tiet/")) return null;
  const slug = decodeURIComponent(path.replace("/chi-tiet/", ""));
  return prods.find(p => p[0].toLowerCase().replace(/\s+/g, "-") === slug) ?? null;
};

export const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

export const LISTABLE = [
  VIEW_KEYS.SWEETS, VIEW_KEYS.DRINKS, VIEW_KEYS.COMBO, VIEW_KEYS.ALL_PRODUCTS,
  "Bánh sinh nhật", "Bánh mousse", "Bánh tart", "Bánh quy",
  "Cafe", "Cà phê", "Cà Phê", "Trà", "Đồ uống khác", "Tìm kiếm",
];

// ── Helper to map DB cart items to FE legacy format ─────────────────────────
export const mapDbCartToLegacy = (dbItems: any[]): any[] => {
  return dbItems.map(item => {
    const p = item.product;
    if (!p) return null;
    const variantPrice = item.variant?.price || 0;
    const formattedPrice = `${Number(variantPrice).toLocaleString("vi-VN")}đ`;
    const categoryName = p.category?.name ?? "Khác";
    const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
    const rawRating = p.averageRating !== undefined && p.averageRating !== null ? p.averageRating : p.rating;
    const rating = rawRating ? String(Number(rawRating).toFixed(1)) : "5.0";
    const badge = p.productType === "combo" ? "Combo" : (p.variants?.length > 1 ? "S/M/L" : "Còn hàng");

    const legacyProduct = [
      p.name,
      formattedPrice,
      categoryName,
      imageUrl,
      rating,
      badge
    ];
    (legacyProduct as any).raw = p;

    let options = {};
    try {
      options = item.note ? JSON.parse(item.note) : {};
    } catch {
      options = { customText: item.note };
    }

    return {
      dbId: item.id,
      product: legacyProduct,
      size: item.variant?.size || "Vừa",
      quantity: item.quantity,
      options: options,
      price: Number(variantPrice),
      productId: item.productId,
      variantId: item.variantId
    };
  }).filter(Boolean);
};

// ── App ───────────────────────────────────────────────────────────────────────
export const ADMIN_ROLES = ["admin", "store_manager"];
export const STAFF_ROLES = ["staff", "cashier"];
export const STORE_STORAGE_KEY = "sb_selected_store";
export const CART_SESSION_KEY = "sb_cart_session_id";
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const getCartSessionId = () => {
  const existing = localStorage.getItem(CART_SESSION_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
};
export const isAdminUser = (currentUser: any) => ADMIN_ROLES.includes(currentUser?.role);
export const isStaffUser = (currentUser: any) => STAFF_ROLES.includes(currentUser?.role);

export interface AdminErrorBoundaryProps {
  children: ReactNode;
  onExit: () => void;
}

export interface AdminErrorBoundaryState {
  hasError: boolean;
}

export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  state: AdminErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AdminErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin panel render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
          <h1 className="text-xl font-semibold">Không thể hiển thị chức năng quản trị</h1>
          <p className="mt-2 text-sm text-muted-foreground">Dữ liệu trả về không hợp lệ. Vui lòng tải lại trang hoặc đăng nhập lại.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Tải lại</button>
            <button type="button" onClick={this.props.onExit} className="rounded-full border px-5 py-2 text-sm">Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }
}

export interface ProtectedRouteRedirectProps {
  message?: string;
  redirect: (view: string) => void;
}

export function ProtectedRouteRedirect({ message, redirect }: ProtectedRouteRedirectProps) {
  useEffect(() => {
    window.history.replaceState(null, "", "/");
    if (message) toast.error(message);
    redirect(VIEW_KEYS.HOME);
  }, [message, redirect]);

  return <><Toaster richColors position="top-center" /><LoadingScreen isLoading={true} /></>;
}

export const estimateDelivery = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") return "Chưa tính";

  const minMinutes = Math.max(25, Math.ceil(22 + distanceKm * 4));
  const maxMinutes = minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);

  return `${minMinutes}-${maxMinutes} phút`;
};

export const apiBranchToStore = (branch: any): StoreLocation => {
  const distanceKm = typeof branch.distanceKm === "number" ? branch.distanceKm : undefined;
  const todayHours = branch.todayOpeningHour;
  const hours = todayHours && !todayHours.isClosed
    ? `${todayHours.openingTime?.slice(0, 5)} - ${todayHours.closingTime?.slice(0, 5)}`
    : "Đóng cửa hôm nay";

  return {
    id: branch.id,
    name: branch.name,
    shortName: branch.name?.replace(/^Sweet Bean\s*/i, "") || branch.name,
    address: branch.address,
    phone: branch.phone || "",
    hours,
    distance: typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km` : "Đang tính",
    delivery: branch.deliveryEstimate || estimateDelivery(distanceKm),
    status: branch.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa",
    highlight: typeof distanceKm === "number" ? "Gần bạn nhất" : "Chi nhánh đang phục vụ",
    mapQuery: branch.address || branch.name,
    isOpenNow: !!branch.isOpenNow,
    todayOpeningHour: todayHours ?? null,
  };
};

