import { useEffect, useState, useRef, Suspense, lazy, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import { AdminPanel } from "./components/AdminPanel";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { StaffPanel } from "./components/StaffPanel";
import { AuthPage } from "./components/AuthPage";
import { ReviewPage } from "./components/ReviewPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { StoreSelectionModal } from "./components/StoreSelectionModal";

import { Home } from "./pages/Home";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout, Success } from "./pages/Checkout";
import { Favorites } from "./pages/Favorites";
import { Profile } from "./pages/Profile";
import { StoreMap } from "./pages/StoreMap";
import { PolicyPage } from "./pages/PolicyPage";
import { OrderTracking } from "./pages/OrderTracking";

import { navPages } from "../data/mockData";
import { storeLocations as fallbackStoreLocations, type StoreLocation } from "../data/storeLocations";
import { env } from "../config/env";
import { VIEW_KEYS } from "../config/appConfig";
import { getDiscountedPrice } from "./components/shared";
import { clearAuthSession, getAccessToken, getAccessTokenExpiry, getStoredUser, refreshAuthSession } from "./components/authSession";

export const matchSize = (itemSize: string, targetSize: string): boolean => {
  if (!targetSize) return true;
  if (!itemSize) return false;
  
  const cleanItem = itemSize.toLowerCase().trim();
  const cleanTarget = targetSize.toLowerCase().trim();
  
  return cleanItem === cleanTarget || cleanItem.startsWith(cleanTarget);
};

// Array format: [name, price, categoryName, imageUrl, rating, badge, discountPrice, bestCouponCode]
const apiProductToArray = (p: any, coupons: any[] = []): any[] => {
  const activeVariants = (p.variants || [])
    .filter((variant: any) => variant.status === "active")
    .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  const originalPrice = activeVariants[0]?.price ? Number(activeVariants[0].price) : 0;
  const price = originalPrice ? `${originalPrice.toLocaleString("vi-VN")}đ` : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = "4.8";
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



const apiCategoryToLegacy = (c: any) => ({
  name: c.name,
  icon: "",
  img: c.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format",
});

const VIEW_PATH_MAP: Record<string, string> = {
  [VIEW_KEYS.HOME]: "/",
  [VIEW_KEYS.SWEETS]: "/banh-ngot",
  [VIEW_KEYS.DRINKS]: "/do-uong",
  [VIEW_KEYS.COMBO]: "/combo",
  [VIEW_KEYS.ALL_PRODUCTS]: "/tat-ca-san-pham",
  [VIEW_KEYS.CART]: "/gio-hang",
  [VIEW_KEYS.CHECKOUT]: "/thanh-toan",
  [VIEW_KEYS.SUCCESS]: "/thanh-cong",
  [VIEW_KEYS.DETAIL]: "/chi-tiet",
  [VIEW_KEYS.ADMIN]: "/admin",
  [VIEW_KEYS.ADMIN_LOGIN]: "/admin/login",
  [VIEW_KEYS.STAFF]: "/nhan-vien",
  [VIEW_KEYS.LOGIN]: "/dang-nhap",
  [VIEW_KEYS.REVIEW]: "/danh-gia",
  [VIEW_KEYS.FAVORITES]: "/yeu-thich",
  [VIEW_KEYS.PROFILE]: "/ho-so",
  [VIEW_KEYS.RESET_PASSWORD]: "/reset-password",
  [VIEW_KEYS.STORES]: "/he-thong-cua-hang",
  [VIEW_KEYS.PRIVACY]: "/chinh-sach-bao-mat",
  [VIEW_KEYS.TERMS]: "/dieu-khoan-dich-vu",
  [VIEW_KEYS.TRACKING]: "/theo-doi",
};

const getPathFromView = (view: string, product?: any) => {
  if (view === VIEW_KEYS.DETAIL && product) {
    return `/chi-tiet/${encodeURIComponent(product[0].toLowerCase().replace(/\s+/g, "-"))}`;
  }
  return VIEW_PATH_MAP[view] ?? `/danh-muc/${encodeURIComponent(view.toLowerCase().replace(/\s+/g, "-"))}`;
};

const getViewFromPath = (path: string, cats: any[] = []) => {
  for (const [key, value] of Object.entries(VIEW_PATH_MAP)) {
    if (value === path) return key;
  }
  if (path.startsWith("/chi-tiet/")) return VIEW_KEYS.DETAIL;
  if (path.startsWith("/danh-muc/")) {
    const slug = decodeURIComponent(path.replace("/danh-muc/", ""));
    return cats.find(c => c.name.toLowerCase().replace(/\s+/g, "-") === slug)?.name ?? VIEW_KEYS.SWEETS;
  }
  return VIEW_KEYS.HOME;
};

const getProductFromPath = (path: string, prods: any[] = []) => {
  if (!path.startsWith("/chi-tiet/")) return null;
  const slug = decodeURIComponent(path.replace("/chi-tiet/", ""));
  return prods.find(p => p[0].toLowerCase().replace(/\s+/g, "-") === slug) ?? null;
};

const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

const LISTABLE = [
  VIEW_KEYS.SWEETS, VIEW_KEYS.DRINKS, VIEW_KEYS.COMBO, VIEW_KEYS.ALL_PRODUCTS,
  "Bánh sinh nhật", "Bánh mousse", "Bánh tart", "Bánh quy",
  "Cafe", "Trà", "Đồ uống khác", "Tìm kiếm",
];

// ── Helper to map DB cart items to FE legacy format ─────────────────────────
const mapDbCartToLegacy = (dbItems: any[]): any[] => {
  return dbItems.map(item => {
    const p = item.product;
    if (!p) return null;
    const variantPrice = item.variant?.price || 0;
    const formattedPrice = `${Number(variantPrice).toLocaleString("vi-VN")}đ`;
    const categoryName = p.category?.name ?? "Khác";
    const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
    const rating = "4.8";
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
const ADMIN_ROLES = ["admin", "store_manager"];
const STAFF_ROLES = ["staff", "cashier"];
const STORE_STORAGE_KEY = "sb_selected_store";
const CART_SESSION_KEY = "sb_cart_session_id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const getCartSessionId = () => {
  const existing = localStorage.getItem(CART_SESSION_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
};
const isAdminUser = (currentUser: any) => ADMIN_ROLES.includes(currentUser?.role);
const isStaffUser = (currentUser: any) => STAFF_ROLES.includes(currentUser?.role);

const estimateDelivery = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") return "Chưa tính";

  const minMinutes = Math.max(25, Math.ceil(22 + distanceKm * 4));
  const maxMinutes = minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);

  return `${minMinutes}-${maxMinutes} phút`;
};

const apiBranchToStore = (branch: any): StoreLocation => {
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

export default function App() {
  const [view, setViewInternal] = useState<any>(() => getViewFromPath(window.location.pathname));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [cartSessionId] = useState(getCartSessionId);
  const [wishlist, setWishlist] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_wishlist") || "[]"));
  const [user, setUser] = useState<any>(getStoredUser);
  const [selectedStore, setSelectedStore] = useState<StoreLocation>(() => {
    const saved = localStorage.getItem(STORE_STORAGE_KEY);
    const savedStore = saved ? fallbackStoreLocations.find((store) => store.id === saved) : null;
    return savedStore ?? fallbackStoreLocations[0];
  });
  const [availableStores, setAvailableStores] = useState<StoreLocation[]>(fallbackStoreLocations);
  const [showStorePopup, setShowStorePopup] = useState(() => {
    return window.location.pathname === "/" && !localStorage.getItem(STORE_STORAGE_KEY);
  });
  const [manualLocationRequired, setManualLocationRequired] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // ── Fetch real products & categories from API ───────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCouponState] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem("appliedCoupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setAppliedCoupon = (coupon: any | null) => {
    setAppliedCouponState(coupon);
    try {
      if (coupon) {
        sessionStorage.setItem("appliedCoupon", JSON.stringify(coupon));
      } else {
        sessionStorage.removeItem("appliedCoupon");
      }
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (appliedCoupon) {
      if (user && Array.isArray(publicCoupons) && publicCoupons.length >= 0) {
        const isStillValid = publicCoupons.some(c => c.code?.toUpperCase()?.trim() === appliedCoupon.code?.toUpperCase()?.trim());
        if (!isStillValid) {
          setAppliedCoupon(null);
          return;
        }
      }
      if (cart.length > 0) {
        const currentSubtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);
        const minOrderVal = Number(appliedCoupon.minOrderValue || 0);
        if (currentSubtotal < minOrderVal) {
          setAppliedCoupon(null);
          toast.error("Voucher đã bị hủy do giỏ hàng không đủ điều kiện đơn hàng tối thiểu.");
          return;
        }
        
        if (appliedCoupon.productId) {
          const hasProduct = cart.some((item: any) => (item.productId || item.product?.raw?.id) === appliedCoupon.productId);
          if (!hasProduct) {
            setAppliedCoupon(null);
            toast.error("Voucher đã bị hủy do sản phẩm áp dụng không còn trong giỏ hàng.");
            return;
          }
        }
        
        if (appliedCoupon.categoriesId) {
          const hasCategory = cart.some((item: any) => {
            const prod = item.product?.raw;
            if (!prod) return false;
            return prod.categoryId === appliedCoupon.categoriesId || prod.categoriesId === appliedCoupon.categoriesId || prod.category?.id === appliedCoupon.categoriesId;
          });
          if (!hasCategory) {
            setAppliedCoupon(null);
            toast.error("Voucher đã bị hủy do không còn sản phẩm thuộc danh mục áp dụng trong giỏ hàng.");
            return;
          }
        }
        
        if (appliedCoupon.targetSize) {
          const hasSize = cart.some((item: any) => matchSize(item.size, appliedCoupon.targetSize));
          if (!hasSize) {
            setAppliedCoupon(null);
            toast.error(`Voucher đã bị hủy do giỏ hàng không có sản phẩm size ${appliedCoupon.targetSize}.`);
            return;
          }
        }
      }
    }
  }, [cart, appliedCoupon, publicCoupons, user]);



  const fetchCart = async (branchId: string, token = getAccessToken()) => {
    if (!UUID_PATTERN.test(branchId)) return;
    try {
      const headers: Record<string, string> = { "X-Session-Id": cartSessionId };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${env.API_URL}/cart?branchId=${branchId}`, {
        headers,
      });
      if (res.ok) {
        const dbCart = await res.json();
        const legacyCart = mapDbCartToLegacy(dbCart.items || []);
        setCart(legacyCart);
      }
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng theo chi nhánh:", err);
    }
  };

  const cartHeaders = (includeJson = false) => {
    const headers: Record<string, string> = { "X-Session-Id": cartSessionId };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
  };

  const cartUrl = (path = "") =>
    `${env.API_URL}/cart${path}?branchId=${selectedStore.id}`;

  const loadPublicData = useCallback(async () => {
    try {
      let couponsList: any[] = [];
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const couponRes = await fetch(`${env.API_URL}/coupons/public`, { headers });
        if (couponRes.ok) {
          couponsList = await couponRes.json();
          setPublicCoupons(couponsList);
        }
      } catch (err) {
        console.error("Lỗi khi tải vouchers:", err);
      }

      const [pRes, cRes] = await Promise.all([
        fetch(`${env.API_URL}/products`),
        fetch(`${env.API_URL}/products/categories`),
      ]);
      if (pRes.ok) {
        const apiProducts = await pRes.json();
        setProducts(apiProducts.map(p => apiProductToArray(p, couponsList)));
      }
      if (cRes.ok) {
        const apiCategories = await cRes.json();
        setCategories(apiCategories.map(apiCategoryToLegacy));
      }
    } catch {
      // Keep empty fallback data if the API is unavailable.
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [user, loadPublicData]);


  useEffect(() => {
    if (!showStorePopup) return;

    const refreshOpeningStatus = async () => {
      try {
        const res = await fetch(`${env.API_URL}/branches/active`);
        if (!res.ok) return;
        const branches = await res.json();
        const statusById = new Map(
          branches.map((branch: any) => [branch.id, apiBranchToStore(branch)]),
        );
        setAvailableStores(current => current.map(store => {
          const fresh = statusById.get(store.id) as StoreLocation | undefined;
          return fresh ? {
            ...store,
            isOpenNow: fresh.isOpenNow,
            status: fresh.status,
            hours: fresh.hours,
            todayOpeningHour: fresh.todayOpeningHour,
          } : store;
        }));
        setSelectedStore(current => {
          const fresh = statusById.get(current.id) as StoreLocation | undefined;
          return fresh ? {
            ...current,
            isOpenNow: fresh.isOpenNow,
            status: fresh.status,
            hours: fresh.hours,
            todayOpeningHour: fresh.todayOpeningHour,
          } : current;
        });
      } catch {
        // Keep the latest known status when the API is temporarily unavailable.
      }
    };

    refreshOpeningStatus();
    const timer = window.setInterval(refreshOpeningStatus, 60_000);
    return () => window.clearInterval(timer);
  }, [showStorePopup]);


  useEffect(() => {
    let cancelled = false;
    let loadedNearbyBranches = false;

    const loadBranches = async () => {
      try {
        const res = await fetch(`${env.API_URL}/branches/active`);
        if (!res.ok) throw new Error("Cannot load branches");

        const apiBranches = await res.json();
        const stores = Array.isArray(apiBranches) ? apiBranches.map(apiBranchToStore) : [];
        if (cancelled || loadedNearbyBranches || stores.length === 0) return;

        setAvailableStores(stores);
        const savedId = localStorage.getItem(STORE_STORAGE_KEY);
        const savedStore = savedId ? stores.find((store) => store.id === savedId) : null;
        setSelectedStore(savedStore ?? stores[0]);
      } catch {
        if (!cancelled) setAvailableStores(fallbackStoreLocations);
      }
    };

    loadBranches();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setManualLocationRequired(false);
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`${env.API_URL}/branches/nearby?lat=${latitude}&lng=${longitude}`);
            if (!res.ok) return;

            const nearbyBranches = await res.json();
            const storesWithDistance = Array.isArray(nearbyBranches)
              ? nearbyBranches.map(apiBranchToStore)
              : [apiBranchToStore(nearbyBranches)];
            const nearest = storesWithDistance.find(store => store.isOpenNow);
            if (cancelled) return;

            if (storesWithDistance.length > 0) {
              loadedNearbyBranches = true;
              setAvailableStores(storesWithDistance);
            }

            if (nearest) {
              setSelectedStore(nearest);
            }
          } catch {
            // Keep the regular active branch list if location lookup fails.
          }
        },
        () => {
          setManualLocationRequired(true);
          if (!localStorage.getItem(STORE_STORAGE_KEY) && window.location.pathname === "/") {
            setShowStorePopup(true);
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      );
    } else {
      setManualLocationRequired(true);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Persist cart & wishlist ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem("sb_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    if (!UUID_PATTERN.test(selectedStore?.id || "")) return;
    setCart([]);
    fetchCart(selectedStore.id);
  }, [selectedStore?.id, user?.id]);

  useEffect(() => {
    const onPop = () => {
      setViewInternal(getViewFromPath(window.location.pathname, categories));
      setSelectedProduct(getProductFromPath(window.location.pathname, products));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [categories, products]);

  // Re-resolve a deep-linked URL (e.g. hard reload on /chi-tiet/:slug) once products/categories
  // finish loading from the API — the initial state above can't know them yet.
  const initialDeepLinkResolved = useRef(false);
  useEffect(() => {
    if (initialDeepLinkResolved.current) return;
    if (products.length === 0 && categories.length === 0) return;
    initialDeepLinkResolved.current = true;
    setViewInternal(getViewFromPath(window.location.pathname, categories));
    setSelectedProduct(getProductFromPath(window.location.pathname, products));
  }, [products, categories]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    if (window.location.pathname === "/reset-password") return;
    (async () => {
      try {
        const res = await fetch(`${env.API_URL}/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Xác thực email thất bại");
        toast.success("Xác thực email thành công! Bạn có thể đăng nhập ngay.");
        setView(VIEW_KEYS.LOGIN);
      } catch (err: any) {
        toast.error(err.message || "Không thể xác thực email.");
      } finally {
        window.history.replaceState({}, document.title, window.location.origin);
      }
    })();
  }, []);

  // ── Session verification on mount ──────────────────────────────────────────
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          let token = getAccessToken();
          if (!token) {
            const refreshed = await refreshAuthSession();
            token = refreshed?.accessToken || null;
            if (refreshed?.user) setUser(refreshed.user);
          }
          if (!token) {
            handleLogout();
            return;
          }
          let res = await fetch(`${env.API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            const refreshed = await refreshAuthSession();
            if (refreshed) {
              setUser(refreshed.user);
              res = await fetch(`${env.API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${refreshed.accessToken}` },
              });
            }
          }
          if (res.status === 401) {
            handleLogout();
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
        } catch {
          // Silent catch to prevent logging out if server is temporarily unreachable
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let timer: number | undefined;
    let cancelled = false;

    const scheduleRefresh = () => {
      const expiresAt = getAccessTokenExpiry();
      if (!expiresAt || cancelled) return;
      const delay = Math.max(30_000, expiresAt - Date.now() - 60_000);
      timer = window.setTimeout(async () => {
        const refreshed = await refreshAuthSession();
        if (cancelled) return;
        if (!refreshed) {
          handleLogout();
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }
        setUser(refreshed.user);
        scheduleRefresh();
      }, delay);
    };

    scheduleRefresh();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [user?.id]);
  const setView = (newView: any, productData?: any) => {
    const target = productData || (newView === VIEW_KEYS.DETAIL ? selectedProduct : null);
    const newPath = getPathFromView(newView, target);
    if (window.location.pathname !== newPath) window.history.pushState(null, "", newPath);
    
    setIsLoading(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      setViewInternal(newView);
      if (newView === VIEW_KEYS.TRACKING) {
        setSelectedOrderId(productData || null);
      } else {
        if (productData) setSelectedProduct(productData);
        else if (newView !== VIEW_KEYS.DETAIL && newView !== VIEW_KEYS.REVIEW) setSelectedProduct(null);
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 400);
  };

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleLoginSuccess = async () => {
    const currentUser = getStoredUser();
    const token = getAccessToken();
    if (token && UUID_PATTERN.test(selectedStore?.id || "")) {
      try {
        const res = await fetch(`${env.API_URL}/cart/merge-session?branchId=${selectedStore.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Session-Id": cartSessionId,
          },
        });
        if (res.ok) {
          const dbCart = await res.json();
          setCart(mapDbCartToLegacy(dbCart.items || []));
        }
      } catch (err) {
        console.error("Lỗi khi gộp giỏ session vào tài khoản:", err);
      }
    }
    setUser(currentUser);

    if (isAdminUser(currentUser)) setView(VIEW_KEYS.ADMIN);
    else if (isStaffUser(currentUser)) setView(VIEW_KEYS.STAFF);
    else setView(VIEW_KEYS.HOME);
  };

  const handleAdminLoginSuccess = (adminUser: any) => {
    setUser(adminUser);
    setView(isStaffUser(adminUser) ? VIEW_KEYS.STAFF : VIEW_KEYS.ADMIN);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setAppliedCoupon(null);
    setCart([]);
    setView(VIEW_KEYS.HOME);
  };

  const handleAdminLogout = () => {
    clearAuthSession();
    setUser(null);
    setCart([]);
    setView(VIEW_KEYS.HOME);
  };

  // ── Cart / Wishlist handlers ─────────────────────────────────────────────
  const handleAddToCart = async (product: any, size = "Vừa", qty = 1, options?: any, price?: number, selectedVariantId?: string) => {
    const rawProduct = product.raw;
    const productId = rawProduct?.id;
    
    let variantId = "";
    let selectedVariant: any = null;
    if (rawProduct && rawProduct.variants) {
      selectedVariant = rawProduct.variants.find((variant: any) => variant.id === selectedVariantId)
        || rawProduct.variants.find((variant: any) => variant.status === "active" && variant.size === size)
        || rawProduct.variants.find((variant: any) => variant.status === "active");
      variantId = selectedVariant?.id || "";
    }

    const cartSize = selectedVariant?.size || size;
    const cartPrice = price ?? Number(selectedVariant?.price || 0);

    const optionsKey = JSON.stringify(options || {});
    const matchesItem = (item: any) =>
      item.variantId === variantId && JSON.stringify(item.options || {}) === optionsKey;

    // Update immediately; the server synchronization happens in the background.
    setCart(prev => {
      const idx = prev.findIndex(matchesItem);
      const newItems = [...prev];
      if (idx > -1) {
        newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + qty };
      } else {
        newItems.push({
          product,
          size: cartSize,
          quantity: qty,
          options,
          price: cartPrice,
          productId,
          variantId,
        });
      }
      return newItems;
    });

    if (!(productId && variantId && UUID_PATTERN.test(selectedStore?.id || ""))) return;
    try {
      const res = await fetch(cartUrl(), {
        method: "POST",
        headers: cartHeaders(true),
        body: JSON.stringify({
          productId,
          variantId,
          quantity: qty,
          note: optionsKey,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể cập nhật giỏ hàng");
      setCart(prev => prev.map(item =>
        matchesItem(item) ? { ...item, dbId: result.itemId } : item,
      ));
    } catch (err: any) {
      setCart(prev => prev.flatMap(item => {
        if (!matchesItem(item)) return [item];
        const quantity = item.quantity - qty;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      }));
      toast.error(err.message || "Không thể cập nhật giỏ hàng. Đã hoàn tác thay đổi.");
    }
  };

  const handleUpdateCartQty = async (index: number, newQty: number) => {
    const item = cart[index];
    if (!item) return;
    const previousQty = item.quantity;
    setCart(prev => {
      const updated = [...prev];
      if (updated[index]) updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });

    if (!(item.dbId && UUID_PATTERN.test(selectedStore?.id || ""))) return;
    try {
      const res = await fetch(cartUrl(`/${item.dbId}`), {
        method: "PATCH",
        headers: cartHeaders(true),
        body: JSON.stringify({ quantity: newQty }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể cập nhật số lượng");
    } catch (err: any) {
      setCart(prev => prev.map(current =>
        current.dbId === item.dbId ? { ...current, quantity: previousQty } : current,
      ));
      toast.error(err.message || "Không thể cập nhật số lượng. Đã hoàn tác thay đổi.");
    }
  };

  const handleRemoveCartItem = async (index: number) => {
    const item = cart[index];
    if (!item) return;

    // Remove immediately; restore the item if server synchronization fails.
    setCart(prev => prev.filter((_, i) => i !== index));

    if (!(item.dbId && UUID_PATTERN.test(selectedStore?.id || ""))) return;
    try {
      const res = await fetch(cartUrl(`/${item.dbId}`), {
        method: "DELETE",
        headers: cartHeaders(),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể xóa sản phẩm");
    } catch (err: any) {
      setCart(prev => {
        if (prev.some(current => current.dbId === item.dbId)) return prev;
        const restored = [...prev];
        restored.splice(Math.min(index, restored.length), 0, item);
        return restored;
      });
      toast.error(err.message || "Không thể xóa sản phẩm. Đã khôi phục lại giỏ hàng.");
    }
  };

  const handleToggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(i => i[0] === product[0]);
      return exists ? prev.filter(i => i[0] !== product[0]) : [...prev, product];
    });
  };

  const handleSelectProduct = (product: any) => setView(VIEW_KEYS.DETAIL, product);
  const handleSelectStore = (store: StoreLocation) => {
    if (store.id !== selectedStore.id) setCart([]);
    setSelectedStore(store);
    localStorage.setItem(STORE_STORAGE_KEY, store.id);
  };

  const handlePlaceOrder = async (checkoutData: any) => {
    const token = getAccessToken();

    const items = cart.map(item => {
      let rawProd = item.product.raw;
      if (!rawProd) {
        const fullProd = products.find(p => p[0] === item.product[0]);
        rawProd = fullProd?.raw;
      }
      if (!rawProd || !rawProd.variants) {
        throw new Error(`Món "${item.product[0]}" không còn tồn tại trên hệ thống. Vui lòng xóa món này khỏi Giỏ hàng của bạn!`);
      }

      let variant = rawProd.variants?.find((v: any) => v.id === item.variantId);
      if (!variant) variant = rawProd.variants?.find((v: any) => v.size === item.size);
      if (!variant) {
        const sizeMap: Record<string, string> = {
          "Nhỏ": "Nhỏ", "Vừa": "Vừa", "Lớn": "Lớn",
          "S": "Nhỏ", "M": "Vừa", "L": "Lớn",
        };
        const mappedSize = sizeMap[item.size] || item.size;
        variant = rawProd.variants?.find((v: any) => v.size === mappedSize) || rawProd.variants?.[0];
      }

      if (!variant) {
        throw new Error(`Sản phẩm ${rawProd.name} không có phiên bản kích thước tương thích.`);
      }

      return {
        productId: rawProd.id,
        variantId: variant.id,
        productName: rawProd.name,
        variantName: variant.variantName,
        quantity: item.quantity,
        unitPrice: Number(variant.price),
        totalPrice: Number(variant.price) * item.quantity,
      };
    });

    const payload = {
      ...checkoutData,
      subtotal,
      discountAmount: discount,
      shippingFee: shipping,
      totalAmount: grandTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      items,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }



      const res = await fetch(`${env.API_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Đặt hàng thất bại");
      }

      try {
        await fetch(cartUrl(), {
          method: "DELETE",
          headers: cartHeaders(),
        });
      } catch (err) {
        console.error("Lỗi khi xóa giỏ hàng theo chi nhánh sau checkout:", err);
      }

      setLastCreatedOrder(resData);
      setCart([]);
      setAppliedCoupon(null);
      toast.success("Đặt hàng thành công!");
      loadPublicData();
      setView(VIEW_KEYS.SUCCESS);
    } catch (err: any) {
      console.error(err);
      


      toast.error(err.message || "Lỗi khi gửi đơn hàng lên máy chủ.");
      throw err;
    }
  };

  const subtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);

  let discount = 0;
  if (user && appliedCoupon) {
    const matchingItems = cart.filter((item: any) => {
      const isProductMatch = !appliedCoupon.productId || (item.productId || item.product?.raw?.id) === appliedCoupon.productId;
      const isCategoryMatch = !appliedCoupon.categoriesId || (
        item.product?.raw?.categoryId === appliedCoupon.categoriesId ||
        item.product?.raw?.categoriesId === appliedCoupon.categoriesId ||
        item.product?.raw?.category?.id === appliedCoupon.categoriesId
      );
      const isSizeMatch = !appliedCoupon.targetSize || matchSize(item.size, appliedCoupon.targetSize);
      return isProductMatch && isCategoryMatch && isSizeMatch;
    });

    const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);

    if (matchingItems.length > 0) {
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(matchingSubtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(matchingSubtotal, Number(appliedCoupon.discountValue));
      }
    }
  }


  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = Math.max(0, subtotal - discount + shipping);


  if (view === VIEW_KEYS.ADMIN_LOGIN) {
    return <><Toaster richColors position="top-center" /><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></>;
  }

  if (view === VIEW_KEYS.ADMIN) {
    if (!user) {
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    if (!isAdminUser(user)) {
      toast.error("Bạn không có quyền truy cập trang quản trị.");
      setTimeout(() => setView(VIEW_KEYS.HOME), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    return <><Toaster richColors position="top-center" /><AdminPanel onExit={handleAdminLogout} adminUser={user} /></>;
  }

  if (view === VIEW_KEYS.STAFF) {
    if (!user) {
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    if (!isStaffUser(user) && !isAdminUser(user)) {
      toast.error("Bạn không có quyền truy cập trang nhân viên.");
      setTimeout(() => setView(VIEW_KEYS.HOME), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    return <><Toaster richColors position="top-center" /><StaffPanel onExit={handleAdminLogout} staffUser={user} products={products} /></>;
  }

  if (view === VIEW_KEYS.LOGIN) return <><Toaster richColors position="top-center" /><AuthPage onSuccess={handleLoginSuccess} setView={setView} /></>;
  if (view === VIEW_KEYS.RESET_PASSWORD) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    return <><Toaster richColors position="top-center" /><AuthPage onSuccess={handleLoginSuccess} initialMode="reset" resetToken={token} /></>;
  }
  if (view === VIEW_KEYS.REVIEW) return <><Toaster richColors position="top-center" /><ReviewPage product={selectedProduct} onBack={() => setView(VIEW_KEYS.DETAIL)} /></>;

  return (
    <>
      <Toaster richColors position="top-center" />
      <LoadingScreen isLoading={isLoading} />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Header
          view={view}
          setView={setView}
          navPages={navPages}
          wishlistCount={wishlist.length}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => setView("Tìm kiếm")}
          isLoggedIn={!!user}
          user={user}
          products={products}
          selectedStore={selectedStore}
          onChooseStore={() => setShowStorePopup(true)}
          onLogout={handleLogout}
        />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} products={products} categories={categories} publicCoupons={publicCoupons} />}
            {view === VIEW_KEYS.CART && <Cart cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveCartItem} setView={setView} publicCoupons={publicCoupons} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} user={user} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={discount} shipping={shipping} grandTotal={grandTotal} user={user} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} order={lastCreatedOrder} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} publicCoupons={publicCoupons} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {view === VIEW_KEYS.TRACKING && <OrderTracking orderId={selectedOrderId || lastCreatedOrder?.id} onBack={() => setView(VIEW_KEYS.HOME)} />}
            {view === VIEW_KEYS.STORES && <StoreMap branches={availableStores} activeStoreId={selectedStore?.id} onSelectStore={(store: any) => { handleSelectStore(store); setView(VIEW_KEYS.HOME); }} />}
            {view === VIEW_KEYS.PRIVACY && <PolicyPage type="privacy" setView={setView} />}
            {view === VIEW_KEYS.TERMS && <PolicyPage type="terms" setView={setView} />}
            {view === VIEW_KEYS.RETURN_POLICY && <PolicyPage type="return" setView={setView} />}
            {view === VIEW_KEYS.ORDER_GUIDE && <PolicyPage type="guide" setView={setView} />}
            {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
          </div>

        </main>
        <Footer setView={setView} />
        {showStorePopup && (
          <StoreSelectionModal
            stores={availableStores}
            selectedStore={selectedStore}
            manualLocationRequired={manualLocationRequired}
            onSelect={handleSelectStore}
            onClose={() => setShowStorePopup(false)}
          />
        )}
      </div>
    </>
  );
}
