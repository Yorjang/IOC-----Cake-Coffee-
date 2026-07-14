import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import { AdminPanel } from "./components/AdminPanel";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { StaffPanel } from "./components/StaffPanel";
import { AuthPage } from "./components/AuthPage";
import { ReviewPage } from "./components/ReviewPage";
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

import { navPages } from "../data/mockData";
import { storeLocations as fallbackStoreLocations, type StoreLocation } from "../data/storeLocations";
import { env } from "../config/env";
import { VIEW_KEYS } from "../config/appConfig";
import { getDiscountedPrice } from "./components/shared";

// Array format: [name, price, categoryName, imageUrl, rating, badge, discountPrice, bestCouponCode]
const apiProductToArray = (p: any, coupons: any[] = []): any[] => {
  const originalPrice = p.variants?.[0]?.price ? Number(p.variants[0].price) : 0;
  const price = originalPrice ? `${originalPrice.toLocaleString("vi-VN")}đ` : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = "4.8";
  const badge = p.productType === "combo" ? "Combo" : (p.variants?.length > 1 ? "S/M/L" : "Còn hàng");

  const { discountedPrice, discountAmount, bestCoupon } = getDiscountedPrice(originalPrice, p.id, coupons);
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
  VIEW_KEYS.SWEETS, VIEW_KEYS.DRINKS, VIEW_KEYS.COMBO,
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
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return JSON.parse(localStorage.getItem(`sb_cart_${u?.id || "guest"}`) || "[]");
  });
  const [wishlist, setWishlist] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_wishlist") || "[]"));
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem("user") || "null"));
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
  const [orderCode, setOrderCode] = useState("");
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);

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


  const fetchUserCart = async (token: string) => {
    try {
      const res = await fetch(`${env.API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const dbCart = await res.json();
        const legacyCart = mapDbCartToLegacy(dbCart.items || []);
        setCart(legacyCart);
      }
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng từ server:", err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let couponsList: any[] = [];
        try {
          const couponRes = await fetch(`${env.API_URL}/coupons/public`);
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
    })();
  }, []);

  useEffect(() => {
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

    const timer = window.setInterval(refreshOpeningStatus, 60_000);
    return () => window.clearInterval(timer);
  }, []);


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
  useEffect(() => { 
    localStorage.setItem(`sb_cart_${user?.id || 'guest'}`, JSON.stringify(cart)); 
  }, [cart, user?.id]);
  useEffect(() => { localStorage.setItem("sb_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    const onPop = () => {
      setViewInternal(getViewFromPath(window.location.pathname, categories));
      setSelectedProduct(getProductFromPath(window.location.pathname, products));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [categories, products]);

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
    const token = localStorage.getItem("accessToken");
    if (user && token) {
      (async () => {
        try {
          const res = await fetch(`${env.API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            handleLogout();
            toast.error("Phiên đăng nhập đã hết hạn hoặc đã thay đổi mật khẩu. Vui lòng đăng nhập lại.");
          } else {
            await fetchUserCart(token);
          }
        } catch {
          // Silent catch to prevent logging out if server is temporarily unreachable
        }
      })();
    }
  }, []);
  const setView = (newView: any, productData?: any) => {
    const target = productData || (newView === VIEW_KEYS.DETAIL ? selectedProduct : null);
    const newPath = getPathFromView(newView, target);
    if (window.location.pathname !== newPath) window.history.pushState(null, "", newPath);
    setViewInternal(newView);
    if (productData) setSelectedProduct(productData);
    else if (newView !== VIEW_KEYS.DETAIL && newView !== VIEW_KEYS.REVIEW) setSelectedProduct(null);
  };

  // ── Auth handlers ────────────────────────────────────────────────────────
  const loadCartForUser = async (currentUser: any) => {
    const token = localStorage.getItem("accessToken");
    if (currentUser && token) {
      await fetchUserCart(token);
    } else {
      const userCart = JSON.parse(localStorage.getItem("sb_cart_guest") || "[]");
      setCart(userCart);
    }
  };

  const handleLoginSuccess = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(currentUser);
    
    // Merge local guest cart to server database
    const token = localStorage.getItem("accessToken");
    const localCart = JSON.parse(localStorage.getItem("sb_cart_guest") || "[]");
    if (token) {
      if (localCart.length > 0) {
        try {
          const mappedLocal = localCart.map((item: any) => {
            const rawProduct = item.product?.raw;
            let variantId = item.variantId;
            if (!variantId && rawProduct?.variants) {
              let mappedSize = item.size;
              if (rawProduct.category?.name === "Bánh sinh nhật" || item.product?.[2] === "Bánh sinh nhật") {
                if (item.size === "Nhỏ") mappedSize = "Nhỏ (15cm)";
                else if (item.size === "Vừa") mappedSize = "Vừa (20cm)";
                else if (item.size === "Lớn") mappedSize = "Lớn (25cm)";
              }
              variantId = rawProduct.variants.find((v: any) => v.size === mappedSize)?.id || rawProduct.variants[0]?.id;
            }
            return {
              productId: item.productId || item.product?.raw?.id,
              variantId,
              quantity: item.quantity,
              note: JSON.stringify(item.options || {}),
            };
          }).filter((i: any) => i.productId && i.variantId);

          const res = await fetch(`${env.API_URL}/cart/merge`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: mappedLocal }),
          });
          if (res.ok) {
            const dbCart = await res.json();
            const legacyCart = mapDbCartToLegacy(dbCart.items || []);
            setCart(legacyCart);
            localStorage.removeItem("sb_cart_guest");
          } else {
            await fetchUserCart(token);
          }
        } catch (err) {
          console.error("Lỗi khi merge giỏ hàng:", err);
          await fetchUserCart(token);
        }
      } else {
        await fetchUserCart(token);
      }
    }

    loadCartForUser(currentUser);

    if (isAdminUser(currentUser)) setView(VIEW_KEYS.ADMIN);
    else if (isStaffUser(currentUser)) setView(VIEW_KEYS.STAFF);
    else setView(VIEW_KEYS.HOME);
  };

  const handleAdminLoginSuccess = (adminUser: any) => {
    setUser(adminUser);
    loadCartForUser(adminUser);
    setView(isStaffUser(adminUser) ? VIEW_KEYS.STAFF : VIEW_KEYS.ADMIN);
  };

  const handleLogout = () => {
    ["accessToken", "refreshToken", "user", "sb_cart"].forEach(k => localStorage.removeItem(k));
    setUser(null);
    setAppliedCoupon(null);
    loadCartForUser(null);
    setView(VIEW_KEYS.HOME);
  };

  const handleAdminLogout = () => {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
    loadCartForUser(null);
    setView(VIEW_KEYS.HOME);
  };

  // ── Cart / Wishlist handlers ─────────────────────────────────────────────
  const handleAddToCart = async (product: any, size = "Vừa", qty = 1, options?: any, price?: number) => {
    const token = localStorage.getItem("accessToken");
    const rawProduct = product.raw;
    const productId = rawProduct?.id;
    
    let variantId = "";
    if (rawProduct && rawProduct.variants) {
      let mappedSize = size;
      if (rawProduct.category?.name === "Bánh sinh nhật" || product[2] === "Bánh sinh nhật") {
        if (size === "Nhỏ") mappedSize = "Nhỏ (15cm)";
        else if (size === "Vừa") mappedSize = "Vừa (20cm)";
        else if (size === "Lớn") mappedSize = "Lớn (25cm)";
      }
      const match = rawProduct.variants.find((v: any) => v.size === mappedSize);
      if (match) {
        variantId = match.id;
      } else {
        variantId = rawProduct.variants[0]?.id;
      }
    }

    if (user && token && productId && variantId) {
      try {
        const res = await fetch(`${env.API_URL}/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            variantId,
            quantity: qty,
            note: JSON.stringify(options || {}),
          }),
        });
        if (res.ok) {
          const dbCart = await res.json();
          const legacyCart = mapDbCartToLegacy(dbCart.items || []);
          setCart(legacyCart);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi lưu giỏ hàng lên server:", err);
      }
    }

    // Local storage fallback for guests
    setCart(prev => {
      const idx = prev.findIndex(i =>
        i.product[0] === product[0] &&
        i.size === size &&
        JSON.stringify(i.options) === JSON.stringify(options)
      );
      const newItems = [...prev];
      if (idx > -1) {
        newItems[idx].quantity += qty;
      } else {
        newItems.push({
          product,
          size,
          quantity: qty,
          options,
          price,
          productId,
          variantId,
        });
      }
      return newItems;
    });
  };

  const handleUpdateCartQty = async (index: number, newQty: number) => {
    const token = localStorage.getItem("accessToken");
    const item = cart[index];
    if (user && token && item && item.dbId) {
      try {
        const res = await fetch(`${env.API_URL}/cart/${item.dbId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQty }),
        });
        if (res.ok) {
          const dbCart = await res.json();
          setCart(mapDbCartToLegacy(dbCart.items || []));
          return;
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật số lượng giỏ hàng trên server:", err);
      }
    }

    // Guest fallback
    setCart(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const handleRemoveCartItem = async (index: number) => {
    const token = localStorage.getItem("accessToken");
    const item = cart[index];
    if (user && token && item && item.dbId) {
      try {
        const res = await fetch(`${env.API_URL}/cart/${item.dbId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const dbCart = await res.json();
          setCart(mapDbCartToLegacy(dbCart.items || []));
          return;
        }
      } catch (err) {
        console.error("Lỗi khi xóa sản phẩm giỏ hàng trên server:", err);
      }
    }

    // Guest fallback
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(i => i[0] === product[0]);
      return exists ? prev.filter(i => i[0] !== product[0]) : [...prev, product];
    });
  };

  const handleSelectProduct = (product: any) => setView(VIEW_KEYS.DETAIL, product);
  const handleSelectStore = (store: StoreLocation) => {
    setSelectedStore(store);
    localStorage.setItem(STORE_STORAGE_KEY, store.id);
  };

  const handlePlaceOrder = async (checkoutData: any) => {
    const token = localStorage.getItem("accessToken");

    const items = cart.map(item => {
      let rawProd = item.product.raw;
      if (!rawProd) {
        const fullProd = products.find(p => p[0] === item.product[0]);
        rawProd = fullProd?.raw || (fullProd as any);
      }
      if (!rawProd || !rawProd.variants) {
        throw new Error(`Không tìm thấy thông tin sản phẩm: ${item.product[0]}`);
      }

      let variant = rawProd.variants?.find((v: any) => v.size === item.size);
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

      // Also clear the cart on the backend DB!
      if (token) {
        try {
          await fetch(`${env.API_URL}/cart`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Lỗi khi xóa giỏ hàng DB sau checkout:", err);
        }
      }

      setLastCreatedOrder(resData);
      setCart([]);
      setAppliedCoupon(null);
      toast.success("Đặt hàng thành công!");
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
    if (appliedCoupon.productId) {
      const matchingItems = cart.filter((item: any) => (item.productId || item.product?.raw?.id) === appliedCoupon.productId);
      const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(matchingSubtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(matchingSubtotal, Number(appliedCoupon.discountValue));
      }
    } else {
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(subtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(subtotal, Number(appliedCoupon.discountValue));
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
        />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} products={products} categories={categories} />}
            {view === VIEW_KEYS.CART && <Cart cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveCartItem} setView={setView} publicCoupons={publicCoupons} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} user={user} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={discount} shipping={shipping} grandTotal={grandTotal} user={user} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} order={lastCreatedOrder} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} publicCoupons={publicCoupons} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {view === VIEW_KEYS.STORES && <StoreMap branches={availableStores} activeStoreId={selectedStore?.id} onSelectStore={(store: any) => { handleSelectStore(store); setView(VIEW_KEYS.HOME); }} />}
            {view === VIEW_KEYS.PRIVACY && <PolicyPage type="privacy" setView={setView} />}
            {view === VIEW_KEYS.TERMS && <PolicyPage type="terms" setView={setView} />}
            {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
          </div>

        </main>
        <Footer setView={setView} />
        {showStorePopup && view === VIEW_KEYS.HOME && (
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
