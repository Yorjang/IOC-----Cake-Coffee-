import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import { AdminPanel } from "./components/AdminPanel";
import { AdminLoginPage } from "./components/AdminLoginPage";
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

import { navPages, heroBanners } from "../data/mockData";
import { storeLocations as fallbackStoreLocations, type StoreLocation } from "../data/storeLocations";
import { env } from "../config/env";
import { VIEW_KEYS } from "../config/appConfig";

// â”€â”€ Transform API product to legacy array format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Array format: [name, price, categoryName, imageUrl, rating, badge]
const apiProductToArray = (p: any): any[] => {
  const price = p.variants?.[0]?.price
    ? `${Number(p.variants[0].price).toLocaleString("vi-VN")}đ`
    : "0đ";
  const categoryName = p.category?.name ?? "KhÃ¡c";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = "4.8";
const badge = p.productType === "combo" ? "Combo" : (p.variants?.length > 1 ? "S/M/L" : "Còn hàng");
  const arr = [p.name, price, categoryName, imageUrl, rating, badge];
  (arr as any).raw = p;
  return arr;
};

// â”€â”€ Transform API category to legacy format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const apiCategoryToLegacy = (c: any) => ({
  name: c.name,
  icon: "",
  img: c.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format",
});

// â”€â”€ URL / Router helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  [VIEW_KEYS.LOGIN]: "/dang-nhap",
  [VIEW_KEYS.REVIEW]: "/danh-gia",
  [VIEW_KEYS.FAVORITES]: "/yeu-thich",
  [VIEW_KEYS.PROFILE]: "/ho-so",
  [VIEW_KEYS.RESET_PASSWORD]: "/reset-password",
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

// â”€â”€ Price helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

// â”€â”€ Listable categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LISTABLE = [
  VIEW_KEYS.SWEETS, VIEW_KEYS.DRINKS, VIEW_KEYS.COMBO,
  "Bánh sinh nhật", "Bánh mousse", "Bánh tart", "Bánh quy",
  "Cafe", "Trà ", "Äá»“ uá»‘ng khÃ¡c", "Tìm kiếm",
];

// â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ADMIN_ROLES = ["admin"];
const isAdminUser = (currentUser: any) => ADMIN_ROLES.includes(currentUser?.role);
const STORE_STORAGE_KEY = "sb_selected_store";

const estimateDelivery = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") return "Chưa tính";

  const minMinutes = Math.max(25, Math.ceil(22 + distanceKm * 4));
  const maxMinutes = minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);

  return `${minMinutes}-${maxMinutes} phút`;
};

const apiBranchToStore = (branch: any): StoreLocation => {
  const distanceKm = typeof branch.distanceKm === "number" ? branch.distanceKm : undefined;

  return {
    id: branch.id,
    name: branch.name,
    shortName: branch.name?.replace(/^Sweet Bean\s*/i, "") || branch.name,
    address: branch.address,
    phone: branch.phone || "",
    hours: branch.hours || "07:00 - 22:00",
    distance: typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km` : "Đang tính",
    delivery: branch.deliveryEstimate || estimateDelivery(distanceKm),
    status: branch.status === "active" ? "Đang mở cửa" : branch.status || "Đang mở cửa",
    highlight: typeof distanceKm === "number" ? "Gần bạn nhất" : "Chi nhánh đang phục vụ",
    mapQuery: branch.address || branch.name,
  };
};

export default function App() {
  const [view, setViewInternal] = useState<any>(() => getViewFromPath(window.location.pathname));
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return JSON.parse(localStorage.getItem(`sb_cart_${u?.id || 'guest'}`) || "[]");
  });
  const [wishlist, setWishlist] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_wishlist") || "[]"));
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem("user") || "null"));
<<<<<<< HEAD
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
=======
  const [orderCode, setOrderCode] = useState("");
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
>>>>>>> b6495b9 (feat: complete checkout validations, sepay webhook integration, and cart partitioning)

  // â”€â”€ Fetch real products & categories from API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${env.API_URL}/products`),
          fetch(`${env.API_URL}/products/categories`),
        ]);
        if (pRes.ok) {
          const apiProducts = await pRes.json();
          setProducts(apiProducts.map(apiProductToArray));
        }
        if (cRes.ok) {
          const apiCategories = await cRes.json();
          setCategories(apiCategories.map(apiCategoryToLegacy));
        }
      } catch { /* silent â€” fallback to empty */ }
    })();
  }, []);

<<<<<<< HEAD
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
            const nearest = storesWithDistance[0];
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

  // â”€â”€ Persist cart & wishlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => { localStorage.setItem("sb_cart", JSON.stringify(cart)); }, [cart]);
=======
  // ── Persist cart & wishlist ──────────────────────────────────────────────
  useEffect(() => { 
    localStorage.setItem(`sb_cart_${user?.id || 'guest'}`, JSON.stringify(cart)); 
  }, [cart, user?.id]);
>>>>>>> b6495b9 (feat: complete checkout validations, sepay webhook integration, and cart partitioning)
  useEffect(() => { localStorage.setItem("sb_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  // â”€â”€ History API (back/forward) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const onPop = () => {
      setViewInternal(getViewFromPath(window.location.pathname, categories));
      setSelectedProduct(getProductFromPath(window.location.pathname, products));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // â”€â”€ Email verification via token query param â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    if (window.location.pathname === "/reset-password") return;
    (async () => {
      try {
        const res = await fetch(`${env.API_URL}/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Xác thực email tháº¥t báº¡i");
        toast.success("Xác thực email thÃ nh cÃ´ng! Báº¡n cÃ³ thá»ƒ đÄƒng nháº­p ngay.");
        setView(VIEW_KEYS.LOGIN);
      } catch (err: any) {
        toast.error(err.message || "Không thể xÃ¡c thá»±c email.");
      } finally {
        window.history.replaceState({}, document.title, window.location.origin);
      }
    })();
  }, []);

  // â”€â”€ Navigation helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const setView = (newView: any, productData?: any) => {
    const target = productData || (newView === VIEW_KEYS.DETAIL ? selectedProduct : null);
    const newPath = getPathFromView(newView, target);
    if (window.location.pathname !== newPath) window.history.pushState(null, "", newPath);
    setViewInternal(newView);
    if (productData) setSelectedProduct(productData);
    else if (newView !== VIEW_KEYS.DETAIL && newView !== VIEW_KEYS.REVIEW) setSelectedProduct(null);
  };

  // â”€â”€ Auth handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLoginSuccess = () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(currentUser);
    
    const userCart = JSON.parse(localStorage.getItem(`sb_cart_${currentUser?.id || 'guest'}`) || "[]");
    setCart(userCart);

    setView(isAdminUser(currentUser) ? VIEW_KEYS.ADMIN : VIEW_KEYS.HOME);
  };
  const handleAdminLoginSuccess = (adminUser: any) => {
    setUser(adminUser);

    const userCart = JSON.parse(localStorage.getItem(`sb_cart_${adminUser?.id || 'guest'}`) || "[]");
    setCart(userCart);

    setView(VIEW_KEYS.ADMIN);
  };
  const handleLogout = () => {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
<<<<<<< HEAD
    toast.success("ÄÃ£ đÄƒng xuáº¥t thÃ nh cÃ´ng!");
=======

    const guestCart = JSON.parse(localStorage.getItem(`sb_cart_guest`) || "[]");
    setCart(guestCart);

    toast.success("Đã đăng xuất thành công!");
>>>>>>> b6495b9 (feat: complete checkout validations, sepay webhook integration, and cart partitioning)
    setView(VIEW_KEYS.LOGIN);
  };
  const handleAdminLogout = () => {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
<<<<<<< HEAD
    toast.success("ÄÃ£ đÄƒng xuáº¥t khá»i trang quản trị.");
=======

    const guestCart = JSON.parse(localStorage.getItem(`sb_cart_guest`) || "[]");
    setCart(guestCart);

    toast.success("Đã đăng xuất khỏi trang quản trị.");
>>>>>>> b6495b9 (feat: complete checkout validations, sepay webhook integration, and cart partitioning)
    setView(VIEW_KEYS.ADMIN_LOGIN);
  };

  // â”€â”€ Cart / Wishlist handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddToCart = (product: any, size = "Vừa", qty = 1, options?: any, price?: number) => {
    setCart(prev => {
      const idx = prev.findIndex(i => 
        i.product[0] === product[0] && 
        i.size === size && 
        JSON.stringify(i.options) === JSON.stringify(options)
      );
      if (idx > -1) { const c = [...prev]; c[idx].quantity += qty; return c; }
      return [...prev, { product, size, quantity: qty, options, price }];
    });
  };
  const handleToggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(i => i[0] === product[0]);
      toast[exists ? "info" : "success"](exists ? "ÄÃ£ xÃ³a khá»i yêu thích" : "ÄÃ£ thÃªm vÃ o yêu thích!");
      return exists ? prev.filter(i => i[0] !== product[0]) : [...prev, product];
    });
  };
  const handleSelectProduct = (product: any) => setView(VIEW_KEYS.DETAIL, product);
<<<<<<< HEAD
  const handlePlaceOrder = () => { setCart([]); setView(VIEW_KEYS.SUCCESS); };
  const handleSelectStore = (store: StoreLocation) => {
    setSelectedStore(store);
    localStorage.setItem(STORE_STORAGE_KEY, store.id);
    toast.success(`Đã chọn ${store.name}`);
=======
  const handlePlaceOrder = async (checkoutData: any) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiến hành đặt hàng!");
      setView(VIEW_KEYS.LOGIN);
      return;
    }

    // Map cart items to backend format
    const items = cart.map(item => {
      let rawProd = item.product.raw;
      if (!rawProd) {
        // Fallback for older cart items in localStorage
        const fullProd = products.find(p => p[0] === item.product[0]);
        rawProd = fullProd?.raw || (fullProd as any);
      }
      if (!rawProd || !rawProd.variants) {
        throw new Error(`Không tìm thấy thông tin sản phẩm: ${item.product[0]}`);
      }

      // Match size to variant
      let variant = rawProd.variants?.find((v: any) => v.size === item.size);
      if (!variant) {
        // Fallback translation sizes
        const sizeMap: Record<string, string> = {
          "Nhỏ": "Nhỏ", "Vừa": "Vừa", "Lớn": "Lớn",
          "S": "Nhỏ", "M": "Vừa", "L": "Lớn"
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
        totalPrice: Number(variant.price) * item.quantity
      };
    });

    const payload = {
      ...checkoutData,
      subtotal,
      discountAmount: 0,
      shippingFee: shipping,
      totalAmount: grandTotal,
      items
    };

    try {
      const res = await fetch(`${env.API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Đặt hàng thất bại");
      }

      setOrderCode(resData.orderCode);
      setLastCreatedOrder(resData);
      setCart([]);
      toast.success("Đặt hàng thành công!");
      setView(VIEW_KEYS.SUCCESS);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi gửi đơn hàng lên máy chủ.");
      throw err;
    }
>>>>>>> b6495b9 (feat: complete checkout validations, sepay webhook integration, and cart partitioning)
  };
 
  // â”€â”€ Checkout totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = subtotal + shipping;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Admin login page (separate, no header)
  if (view === VIEW_KEYS.ADMIN_LOGIN) {
    return <><Toaster richColors position="top-center" /><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></>;
  }

  // Admin panel â€” role-guarded
  if (view === VIEW_KEYS.ADMIN) {
    if (!user) {
      // Not logged in â†’ redirect to admin login
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    if (!isAdminUser(user)) {
      // Logged in but not admin â†’ back to home
      toast.error("Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p trang quản trị.");
      setTimeout(() => setView(VIEW_KEYS.HOME), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    return <><Toaster richColors position="top-center" /><AdminPanel onExit={handleAdminLogout} adminUser={user} /></>;
  }

  if (view === VIEW_KEYS.LOGIN) return <><Toaster richColors position="top-center" /><AuthPage onSuccess={handleLoginSuccess} /></>;
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
            {view === VIEW_KEYS.CART && <Cart cart={cart} setCart={setCart} setView={setView} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={0} shipping={shipping} grandTotal={grandTotal} user={user} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} order={lastCreatedOrder} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
          </div>
        </main>
        <Footer />
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

