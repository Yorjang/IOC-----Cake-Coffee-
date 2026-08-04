import { AdminPanel } from "./AdminPanel";
import { AuthPage } from "./AuthPage";
import { StaffPanel } from "./StaffPanel";
import { AdminLoginPage } from "./AdminLoginPage";

import { Cart } from "../pages/Cart";
import { Checkout } from "../pages/Checkout";
import { Favorites } from "../pages/Favorites";
import { Home } from "../pages/Home";
import { OrderTracking } from "../pages/OrderTracking";
import { PolicyPage } from "../pages/PolicyPage";
import { ProductDetail } from "../pages/ProductDetail";
import { ProductListing } from "../pages/ProductListing";
import { Profile } from "../pages/Profile";
import { StoreMap } from "../pages/StoreMap";
import { Success } from "../pages/Success";

import { VIEW_KEYS } from "../../config/appConfig";
import { getAccessToken } from "./authSession";
import { LISTABLE, isAdminUser, isStaffUser, AdminErrorBoundary, ProtectedRouteRedirect } from '../../utils/appUtils';

export function AppRoutes({
  view, setView, setViewInternal, user, setUser,
  cart, handleUpdateCartQty, handleRemoveCartItem,
  appliedCoupon, setAppliedCoupon,
  handlePlaceOrder, subtotal, discount, shipping, grandTotal,
  lastCreatedOrder, selectedProduct, handleAddToCart,
  wishlist, handleToggleWishlist, handleSelectProduct,
  products, publicCoupons, categories, searchQuery,
  selectedOrderId, availableStores, selectedStore, handleSelectStore, handleAdminLogout, handleLoginSuccess
}: any) {

  if (view === VIEW_KEYS.ADMIN) {
    if (!user || !getAccessToken() || !isAdminUser(user)) {
      return (
        <AdminLoginPage
          onSuccess={(u: any) => {
            setUser(u);
            setView(VIEW_KEYS.ADMIN);
          }}
          onBack={() => setView(VIEW_KEYS.HOME)}
        />
      );
    }
    return (
      <AdminErrorBoundary onExit={handleAdminLogout}>
        <AdminPanel onExit={handleAdminLogout} adminUser={user} />
      </AdminErrorBoundary>
    );
  }

  if (view === VIEW_KEYS.STAFF) {
    if (!user || !getAccessToken()) {
      return <ProtectedRouteRedirect message="Vui lòng đăng nhập từ trang chủ." redirect={setViewInternal} />;
    }
    if (!isStaffUser(user) && !isAdminUser(user)) {
      return <ProtectedRouteRedirect message="Bạn không có quyền truy cập trang nhân viên." redirect={setViewInternal} />;
    }
    return <StaffPanel onExit={handleAdminLogout} staffUser={user} products={products} />;
  }

  if (view === VIEW_KEYS.LOGIN || view === VIEW_KEYS.REGISTER || view === VIEW_KEYS.FORGOT_PASSWORD) {
    const mode = view === VIEW_KEYS.REGISTER ? "register" : view === VIEW_KEYS.FORGOT_PASSWORD ? "forgot" : "login";
    return <AuthPage onSuccess={handleLoginSuccess} setView={setView} initialMode={mode} />;
  }
  if (view === VIEW_KEYS.RESET_PASSWORD) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    return <AuthPage onSuccess={handleLoginSuccess} initialMode="reset" resetToken={token} />;
  }

  return (
    <div className="animate-page-change" key={view}>
      {view === VIEW_KEYS.HOME && <Home setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} products={products} categories={categories} publicCoupons={publicCoupons} />}
      {view === VIEW_KEYS.CART && <Cart cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveCartItem} setView={setView} publicCoupons={publicCoupons} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} user={user} />}
      {view === VIEW_KEYS.CHECKOUT && <Checkout cart={cart} setView={setView} onPlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={discount} shipping={shipping} grandTotal={grandTotal} user={user} publicCoupons={publicCoupons} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} />}
      {view === VIEW_KEYS.SUCCESS && <Success setView={setView} order={lastCreatedOrder} />}
      {view === VIEW_KEYS.DETAIL && <ProductDetail product={selectedProduct} setView={setView} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} products={products} publicCoupons={publicCoupons} />}
      {view === VIEW_KEYS.FAVORITES && <Favorites wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onSelectProduct={handleSelectProduct} setView={setView} />}
      {view === VIEW_KEYS.PROFILE && <Profile user={user} setUser={setUser} setView={setView} onLogout={handleAdminLogout} />}
      {view === VIEW_KEYS.TRACKING && <OrderTracking orderId={selectedOrderId || lastCreatedOrder?.id} onBack={() => setView(VIEW_KEYS.HOME)} />}
      {view === VIEW_KEYS.STORES && <StoreMap branches={availableStores} activeStoreId={selectedStore?.id} onSelectStore={(store: any) => { handleSelectStore(store); setView(VIEW_KEYS.HOME); }} />}
      {view === VIEW_KEYS.PRIVACY && <PolicyPage type="privacy" setView={setView} />}
      {view === VIEW_KEYS.TERMS && <PolicyPage type="terms" setView={setView} />}
      {view === VIEW_KEYS.RETURN_POLICY && <PolicyPage type="return" setView={setView} />}
      {view === VIEW_KEYS.ORDER_GUIDE && <PolicyPage type="guide" setView={setView} />}
      {(LISTABLE.includes(view) || categories.some((category: any) => category.name === view)) && <ProductListing category={view} categories={categories} setView={setView} onSelectProduct={handleSelectProduct} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} searchQuery={searchQuery} products={products} />}
    </div>
  );
}
