import { Suspense, lazy } from "react";
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

// Lazy Loaded Components
const AdminPanel = lazy(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const AdminLoginPage = lazy(() => import("./components/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const StaffPanel = lazy(() => import("./components/StaffPanel").then(m => ({ default: m.StaffPanel })));
const AuthPage = lazy(() => import("./components/AuthPage").then(m => ({ default: m.AuthPage })));
const ReviewPage = lazy(() => import("./components/ReviewPage").then(m => ({ default: m.ReviewPage })));
const Favorites = lazy(() => import("./pages/Favorites").then(m => ({ default: m.Favorites })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const StoreMap = lazy(() => import("./pages/StoreMap").then(m => ({ default: m.StoreMap })));
const PolicyPage = lazy(() => import("./pages/PolicyPage").then(m => ({ default: m.PolicyPage })));
const OrderTracking = lazy(() => import("./pages/OrderTracking").then(m => ({ default: m.OrderTracking })));

import { useAppInit, matchSize, getPathFromView } from "./features/core/hooks/useAppInit";
const navPages = ["Trang chủ", "Bánh ngọt", "Cafe/Đồ uống", "Combo", "Hệ thống cửa hàng"];

export { matchSize, getPathFromView };

export default function App() {
  const {
    view, setView,
    isLoading,
    selectedProduct, handleSelectProduct,
    searchQuery, setSearchQuery,
    cart, handleUpdateCartQty, handleRemoveCartItem, handleAddToCart,
    wishlist, handleToggleWishlist,
    user, setUser, handleLoginSuccess, handleLogout,
    selectedStore, handleSelectStore, availableStores,
    showStorePopup, setShowStorePopup, manualLocationRequired,
    categories, products, publicCoupons,
    appliedCoupon, setAppliedCoupon,
    subtotal, discount, shipping, grandTotal,
    lastCreatedOrder, handlePlaceOrder,
    selectedOrderId, setSelectedOrderId,
    handleAdminLoginSuccess, handleAdminLogout,
    isAdminUser, isStaffUser, LISTABLE,
    VIEW_KEYS
  } = useAppInit();


  if (view === VIEW_KEYS.ADMIN_LOGIN) {
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></Suspense></>;
  }

  if (view === VIEW_KEYS.ADMIN) {
    if (!user || !isAdminUser(user)) {
      if (user && !isAdminUser(user)) {
        toast.error("Tài khoản hiện tại không có quyền Admin. Vui lòng đăng nhập tài khoản Quản trị.");
      }
      window.history.replaceState(null, "", "/admin/login");
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></Suspense></>;
    }
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminPanel onExit={handleAdminLogout} adminUser={user} /></Suspense></>;
  }

  if (view === VIEW_KEYS.STAFF) {
    if (!user) {
      window.history.replaceState(null, "", "/admin/login");
      setTimeout(() => setView(VIEW_KEYS.ADMIN_LOGIN), 0);
      return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={() => setView(VIEW_KEYS.HOME)} /></Suspense></>;
    }
    if (!isStaffUser(user) && !isAdminUser(user)) {
      toast.error("Bạn không có quyền truy cập trang nhân viên.");
      setTimeout(() => setView(VIEW_KEYS.HOME), 0);
      return <><Toaster richColors position="top-center" /></>;
    }
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><StaffPanel onExit={handleAdminLogout} staffUser={user} products={products} /></Suspense></>;
  }

  if (view === VIEW_KEYS.LOGIN) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={handleLoginSuccess} initialMode="login" setView={setView} /></Suspense></>;
  if (view === VIEW_KEYS.REGISTER) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={handleLoginSuccess} initialMode="register" setView={setView} /></Suspense></>;
  if (view === VIEW_KEYS.FORGOT_PASSWORD) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={handleLoginSuccess} initialMode="forgot" setView={setView} /></Suspense></>;
  if (view === VIEW_KEYS.RESET_PASSWORD) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><AuthPage onSuccess={handleLoginSuccess} initialMode="reset" resetToken={token} setView={setView} /></Suspense></>;
  }
  if (view === VIEW_KEYS.REVIEW) return <><Toaster richColors position="top-center" /><Suspense fallback={<LoadingScreen isLoading={true} />}><ReviewPage product={selectedProduct} onBack={() => setView(VIEW_KEYS.DETAIL)} /></Suspense></>;

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
          lastCreatedOrder={lastCreatedOrder}
        />
        <main className="min-h-[calc(100vh-400px)]">
          <div className="animate-page-change" key={view}>
            <Suspense fallback={<LoadingScreen isLoading={true} />}>
              {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} products={products} categories={categories} publicCoupons={publicCoupons} />}
            {view === VIEW_KEYS.CART && <Cart cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveCartItem} setView={setView} publicCoupons={publicCoupons} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} user={user} />}
            {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={discount} shipping={shipping} grandTotal={grandTotal} user={user} setUser={setUser} />}
            {view === VIEW_KEYS.SUCCESS && <Success setView={setView} order={lastCreatedOrder} />}
            {view === VIEW_KEYS.PAYMENT && <Success setView={setView} order={null} orderId={selectedOrderId} />}
            {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} publicCoupons={publicCoupons} />}
            {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
            {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleLogout} />}
            {view === VIEW_KEYS.TRACKING && <OrderTracking orderId={selectedOrderId} onBack={() => setView(VIEW_KEYS.HOME)} />}
            {view === VIEW_KEYS.STORES && <StoreMap branches={availableStores} activeStoreId={selectedStore?.id} onSelectStore={(store: any) => { handleSelectStore(store); setView(VIEW_KEYS.HOME); }} />}
            {view === VIEW_KEYS.PRIVACY && <PolicyPage type="privacy" setView={setView} />}
            {view === VIEW_KEYS.TERMS && <PolicyPage type="terms" setView={setView} />}
            {view === VIEW_KEYS.RETURN_POLICY && <PolicyPage type="return" setView={setView} />}
            {view === VIEW_KEYS.ORDER_GUIDE && <PolicyPage type="guide" setView={setView} />}
              {LISTABLE.includes(view) && <ProductListing category={view} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
            </Suspense>
          </div>
        </main>
        <Footer setView={setView} />
        <ActiveOrderBanner 
          lastCreatedOrder={lastCreatedOrder} 
          isHidden={view === VIEW_KEYS.TRACKING || view === VIEW_KEYS.PAYMENT}
          onClick={(id) => { setSelectedOrderId(id); setView(VIEW_KEYS.TRACKING); }} 
          onPayment={(id) => setView(VIEW_KEYS.PAYMENT, id)}
        />
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

