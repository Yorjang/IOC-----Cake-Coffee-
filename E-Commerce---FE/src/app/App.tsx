import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { LoadingScreen } from "./components/LoadingScreen";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { StoreSelectionModal } from "./components/StoreSelectionModal";
import { ActiveOrderBanner } from "./components/ActiveOrderBanner";
import { Home } from "./pages/Home";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Success } from "./pages/Success";
import { useInitializeApp } from "./store/useInitializeApp";
import { useAppStore } from "./store/useAppStore";
import { useOrderStore } from "./store/useOrderStore";
import { useLocationStore } from "./store/useLocationStore";
import { VIEW_KEYS, LISTABLE } from "../config/appConfig";

import { getPathFromView, getViewFromPath } from "../utils/router";

// Lazy Loaded Components
const AdminPanel = lazy(() => import("./components/admin/AdminPanelMain").then(m => ({ default: m.AdminPanel })));
const AdminLoginPage = lazy(() => import("./components/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const StaffPanel = lazy(() => import("./components/StaffPanel").then(m => ({ default: m.StaffPanel })));
const AuthPage = lazy(() => import("./components/AuthPage").then(m => ({ default: m.AuthPage })));
const ReviewPage = lazy(() => import("./components/ReviewPage").then(m => ({ default: m.ReviewPage })));
const Favorites = lazy(() => import("./pages/Favorites").then(m => ({ default: m.Favorites })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const StoreMap = lazy(() => import("./pages/StoreMap").then(m => ({ default: m.StoreMap })));
const PolicyPage = lazy(() => import("./pages/PolicyPage").then(m => ({ default: m.PolicyPage })));
const OrderTracking = lazy(() => import("./pages/OrderTracking").then(m => ({ default: m.OrderTracking })));


const navPages = ["Trang chủ", "Bánh ngọt", "Cafe/Đồ uống", "Combo", "Hệ thống cửa hàng"];



export default function App() {
  useInitializeApp();
  const { view, setView } = useAppStore();
  const { user } = useAuthStore();
  const { products } = useProductStore();
  const { selectedOrderId } = useOrderStore();
  const { showStorePopup, setShowStorePopup, availableStores, selectedStore, manualLocationRequired, setSelectedStore } = useLocationStore();
  const isLoading = useAppStore(s => s.isLoading);
  
  // Browser URL Sync (Router)
  useEffect(() => {
    const newPath = getPathFromView(view, selectedOrderId ? ["dummy", "product"] : undefined);
    if (window.location.pathname !== newPath) {
      window.history.pushState({ view }, "", newPath);
    }
  }, [view]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setView(e.state.view);
      } else {
        setView(getViewFromPath(window.location.pathname));
      }
    };
    // Initialize on first load if path is not root
    if (window.location.pathname !== "/" && view === VIEW_KEYS.HOME) {
       setView(getViewFromPath(window.location.pathname));
    }
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setView]);
  
  const navPages = ["Trang chủ", "Bánh ngọt", "Cafe/Đồ uống", "Combo", "Hệ thống cửa hàng"];

  const isAdminUser = (u: any) => u?.role === 'admin';
  const isStaffUser = (u: any) => u?.role === 'staff';

  if (view === VIEW_KEYS.ADMIN_LOGIN) {
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminLoginPage onSuccess={() => setView(VIEW_KEYS.ADMIN)} onBack={() => setView(VIEW_KEYS.HOME)} /></Suspense></>;
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
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminPanel onExit={() => setView(VIEW_KEYS.HOME)} adminUser={user} /></Suspense></>;
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
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><StaffPanel onExit={() => setView(VIEW_KEYS.HOME)} staffUser={user} products={products} /></Suspense></>;
  }

  if (view === VIEW_KEYS.LOGIN) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={() => setView(VIEW_KEYS.HOME)} setView={setView} /></Suspense></>;
  if (view === VIEW_KEYS.RESET_PASSWORD) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={() => setView(VIEW_KEYS.HOME)} initialMode="reset" resetToken={token} /></Suspense></>;
  }
  if (view === VIEW_KEYS.REVIEW) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><ReviewPage onBack={() => setView(VIEW_KEYS.DETAIL)} /></Suspense></>;

  return (
    <>
      <Toaster richColors position="top-center" />
      <LoadingScreen isLoading={isLoading} />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Header navPages={navPages} />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              {view === VIEW_KEYS.HOME && <Home />}
            {view === VIEW_KEYS.CART && <Cart />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout />}
            {view === VIEW_KEYS.SUCCESS && <Success />}
            {view === VIEW_KEYS.PAYMENT && <Success orderId={selectedOrderId} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail />}
            {view === VIEW_KEYS.FAVORITES && <Favorites />}
            {view === VIEW_KEYS.PROFILE && <Profile />}
            {view === VIEW_KEYS.TRACKING && <OrderTracking />}
            {view === VIEW_KEYS.STORES && <StoreMap />}
            {view === VIEW_KEYS.PRIVACY && <PolicyPage type="privacy" />}
            {view === VIEW_KEYS.TERMS && <PolicyPage type="terms" />}
            {view === VIEW_KEYS.RETURN_POLICY && <PolicyPage type="return" />}
            {view === VIEW_KEYS.ORDER_GUIDE && <PolicyPage type="guide" />}
              {LISTABLE.includes(view) && <ProductListing />}
            </Suspense>
          </div>
        </main>
        <Footer />
        <ActiveOrderBanner />
        {showStorePopup && (
          <StoreSelectionModal
            stores={availableStores}
            selectedStore={selectedStore}
            manualLocationRequired={manualLocationRequired}
            onSelect={setSelectedStore}
            onClose={() => setShowStorePopup(false)}
          />
        )}
      </div>
    </>
  );
}

