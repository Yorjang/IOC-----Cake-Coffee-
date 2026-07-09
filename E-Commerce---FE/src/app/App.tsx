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

import { categories, products, navPages } from "../data/mockData";
import { env } from "../config/env";
import { VIEW_KEYS } from "../config/appConfig";

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

const getViewFromPath = (path: string) => {
  for (const [key, value] of Object.entries(VIEW_PATH_MAP)) {
    if (value === path) return key;
  }
  if (path.startsWith("/chi-tiet/")) return VIEW_KEYS.DETAIL;
  if (path.startsWith("/danh-muc/")) {
    const slug = decodeURIComponent(path.replace("/danh-muc/", ""));
    return categories.find(c => c.name.toLowerCase().replace(/\s+/g, "-") === slug)?.name ?? VIEW_KEYS.SWEETS;
  }
  return VIEW_KEYS.HOME;
};

const getProductFromPath = (path: string) => {
  if (!path.startsWith("/chi-tiet/")) return null;
  const slug = decodeURIComponent(path.replace("/chi-tiet/", ""));
  return products.find(p => p[0].toLowerCase().replace(/\s+/g, "-") === slug) ?? null;
};

// ── Price helpers ─────────────────────────────────────────────────────────────
const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

// ── Listable categories ───────────────────────────────────────────────────────
const LISTABLE = [
  VIEW_KEYS.SWEETS, VIEW_KEYS.DRINKS, VIEW_KEYS.COMBO,
  "Bánh sinh nhật", "Bánh mousse", "Bánh tart", "Bánh quy",
  "Cafe", "Trà", "Đồ uống khác", "Tìm kiếm",
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setViewInternal] = useState<any>(() => getViewFromPath(window.location.pathname));
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_cart") || "[]"));
  const [wishlist, setWishlist] = useState<any[]>(() => JSON.parse(localStorage.getItem("sb_wishlist") || "[]"));
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem("user") || "null"));

  // ── Persist cart & wishlist ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem("sb_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("sb_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  // ── History API (back/forward) ───────────────────────────────────────────
  useEffect(() => {
    const onPop = () => {
      setViewInternal(getViewFromPath(window.location.pathname));
      setSelectedProduct(getProductFromPath(window.location.pathname));
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
  const handleLoginSuccess = () => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
    setView(VIEW_KEYS.HOME);
  };
  const handleAdminLoginSuccess = (adminUser: any) => {
    setUser(adminUser);
    setView(VIEW_KEYS.ADMIN);
  };
  const handleLogout = () => {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
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
  const handleAddToCart = (product: any, size = "Vừa", qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product[0] === product[0] && i.size === size);
      if (idx > -1) { const c = [...prev]; c[idx].quantity += qty; return c; }
      return [...prev, { product, size, quantity: qty }];
    });
  };
  const handleToggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(i => i[0] === product[0]);
      toast[exists ? "info" : "success"](exists ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích!");
      return exists ? prev.filter(i => i[0] !== product[0]) : [...prev, product];
    });
  };
  const handleSelectProduct = (product: any) => setView(VIEW_KEYS.DETAIL, product);
  const handlePlaceOrder = () => { setCart([]); setView(VIEW_KEYS.SUCCESS); };

  // ── Checkout totals ──────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + parsePrice(i.product[1]) * i.quantity, 0);
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = subtotal + shipping;

  // ── Render ───────────────────────────────────────────────────────────────
  const ADMIN_ROLES = ["admin", "staff", "cashier", "store_manager"];

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
    if (!ADMIN_ROLES.includes(user.role)) {
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
        />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} />}
            {view === VIEW_KEYS.CART && <Cart cart={cart} setCart={setCart} setView={setView} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={0} shipping={shipping} grandTotal={grandTotal} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} />}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
