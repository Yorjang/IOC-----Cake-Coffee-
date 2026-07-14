import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import { AdminPanel } from "./components/AdminPanel";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { AuthPage } from "./components/AuthPage";
import { ReviewPage } from "./components/ReviewPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import { Home } from "./pages/Home";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout, Success } from "./pages/Checkout";
import { Favorites } from "./pages/Favorites";
import { Profile } from "./pages/Profile";

import { navPages, heroBanners } from "../data/mockData";
import { env } from "../config/env";
import { VIEW_KEYS } from "../config/appConfig";

// ── Transform API product to legacy array format ──────────────────────────────
// Array format: [name, price, categoryName, imageUrl, rating, badge]
const apiProductToArray = (p: any): any[] => {
  const price = p.variants?.[0]?.price
    ? `${Number(p.variants[0].price).toLocaleString("vi-VN")}đ`
    : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = "4.8";
  const badge = p.productType === "combo" ? "Combo" : (p.variants?.length > 1 ? "S/M/L" : "Còn hàng");
  return [p.name, price, categoryName, imageUrl, rating, badge, p.id, p];
};

// ── Transform API category to legacy format ───────────────────────────────────
const apiCategoryToLegacy = (c: any) => ({
  name: c.name,
  icon: "",
  img: c.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format",
});

// ── URL / Router helpers ──────────────────────────────────────────────────────
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

// ── Price helpers ─────────────────────────────────────────────────────────────
const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

// ── Listable categories ───────────────────────────────────────────────────────
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
      badge,
      p.id,
      p
    ];
    
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
const ADMIN_ROLES = ["admin"];
const isAdminUser = (currentUser: any) => ADMIN_ROLES.includes(currentUser?.role);

export default function App() {
  const [view, setViewInternal] = useState<any>(() => getViewFromPath(window.location.pathname));
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_cart") || "[]"));
  const [wishlist, setWishlist] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_wishlist") || "[]"));
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem("user") || "null"));

  // ── Fetch real products & categories from API ─────────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

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
      } catch { /* silent — fallback to empty */ }
    })();
  }, []);

  // ── Persist cart & wishlist ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem("sb_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("sb_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  // ── History API (back/forward) ───────────────────────────────────────────
  useEffect(() => {
    const onPop = () => {
      setViewInternal(getViewFromPath(window.location.pathname, categories));
      setSelectedProduct(getProductFromPath(window.location.pathname, products));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Email verification via token query param ─────────────────────────────
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

  // ── Navigation helper ────────────────────────────────────────────────────
  const setView = (newView: any, productData?: any) => {
    const target = productData || (newView === VIEW_KEYS.DETAIL ? selectedProduct : null);
    const newPath = getPathFromView(newView, target);
    if (window.location.pathname !== newPath) window.history.pushState(null, "", newPath);
    setViewInternal(newView);
    if (productData) setSelectedProduct(productData);
    else if (newView !== VIEW_KEYS.DETAIL && newView !== VIEW_KEYS.REVIEW) setSelectedProduct(null);
  };

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleLoginSuccess = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(currentUser);
    
    // Merge local cart to server database
    const token = localStorage.getItem("accessToken");
    const localCart = JSON.parse(localStorage.getItem("sb_cart") || "[]");
    if (token) {
      if (localCart.length > 0) {
        try {
          const mappedLocal = localCart.map((item: any) => {
            const rawProduct = item.product?.[7];
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
              productId: item.productId || item.product?.[6],
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
            localStorage.removeItem("sb_cart");
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

    setView(isAdminUser(currentUser) ? VIEW_KEYS.ADMIN : VIEW_KEYS.HOME);
  };

  const handleAdminLoginSuccess = (adminUser: any) => {
    setUser(adminUser);
    setView(VIEW_KEYS.ADMIN);
  };

  const handleLogout = () => {
    ["accessToken", "refreshToken", "user", "sb_cart"].forEach(k => localStorage.removeItem(k));
    setUser(null);
    setCart([]);
    toast.success("Đã đăng xuất thành công!");
    setView(VIEW_KEYS.LOGIN);
  };

  const handleAdminLogout = () => {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
    toast.success("Đã đăng xuất khỏi trang quản trị.");
    setView(VIEW_KEYS.ADMIN_LOGIN);
  };

  // ── Cart / Wishlist handlers ─────────────────────────────────────────────
  const handleAddToCart = async (product: any, size = "Vừa", qty = 1, options?: any, price?: number) => {
    const token = localStorage.getItem("accessToken");
    const productId = product[6];
    const rawProduct = product[7];
    
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
          toast.success(`Đã thêm ${qty} x ${product[0]} vào giỏ hàng!`);
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
    toast.success(`Đã thêm ${qty} x ${product[0]} vào giỏ hàng!`);
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
          toast.error("Đã xóa sản phẩm khỏi giỏ hàng");
          return;
        }
      } catch (err) {
        console.error("Lỗi khi xóa sản phẩm giỏ hàng trên server:", err);
      }
    }

    // Guest fallback
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.error("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const handleToggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(i => i[0] === product[0]);
      toast[exists ? "info" : "success"](exists ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích!");
      return exists ? prev.filter(i => i[0] !== product[0]) : [...prev, product];
    });
  };

  const handleSelectProduct = (product: any) => setView(VIEW_KEYS.DETAIL, product);

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (user && token) {
      try {
        await fetch(`${env.API_URL}/cart`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Lỗi khi xóa giỏ hàng DB sau checkout:", err);
      }
    }
    setCart([]);
    setView(VIEW_KEYS.SUCCESS);
  };
 
  // ── Checkout totals ──────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = subtotal + shipping;

  // ── Render ───────────────────────────────────────────────────────────────
  // Admin login page (separate, no header)
  if (view === VIEW_KEYS.ADMIN_LOGIN) {
    return <><Toaster richColors position="top-center" /><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></>;
  }

  // Admin panel — role-guarded
  if (view === VIEW_KEYS.ADMIN) {
    if (!user) {
      // Not logged in → redirect to admin login
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    if (!isAdminUser(user)) {
      // Logged in but not admin → back to home
      toast.error("Bạn không có quyền truy cập trang quản trị.");
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
        />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} products={products} categories={categories} />}
            {view === VIEW_KEYS.CART && <Cart cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveCartItem} setView={setView} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={0} shipping={shipping} grandTotal={grandTotal} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
