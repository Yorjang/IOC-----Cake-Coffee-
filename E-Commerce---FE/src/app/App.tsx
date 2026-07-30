import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { parseRes } from "../utils/api";
import { env } from "../config/env";
import { FloatingContact } from "./components/FloatingContact";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { LoadingScreen } from "./components/LoadingScreen";
import { SalesNotification } from "./components/SalesNotification";
import { StoreSelectionModal } from "./components/StoreSelectionModal";
import { AppRoutes } from "./components/AppRoutes";
import { useAppState } from "./hooks/useAppState";
import { useCartState } from "./hooks/useCartState";
import { NAV_PAGES, VIEW_KEYS } from "../config/appConfig";
import { STORE_STORAGE_KEY, getPathFromView, VIEW_PATH_MAP, parsePrice } from '../utils/appUtils';
import { clearAuthSession } from "./components/authSession";
import { rememberTrackingOrder } from "./features/order-tracking/services/orderTrackingService";

export default function App() {
  const appState = useAppState();
  const cartState = useCartState(appState.user, appState.selectedStore);

  const {
    view, setViewInternal, isLoading,
    selectedProduct, setSelectedProduct, searchQuery, setSearchQuery,
    wishlist, setWishlist, user, setUser,
    selectedStore, setSelectedStore, availableStores,
    showStorePopup, setShowStorePopup, manualLocationRequired,
    lastCreatedOrder, setLastCreatedOrder, selectedOrderId,
    products, categories, publicCoupons
  } = appState;

  const {
    cart, setCart, appliedCoupon, setAppliedCoupon,
    fetchCart, cartHeaders, handleAddToCart, handleUpdateCartQty, handleRemoveCartItem,
    subtotal, discount, shipping, grandTotal
  } = cartState;

  const setView = (newView: string) => {
    setViewInternal(newView);
    if (newView !== VIEW_KEYS.DETAIL) setSelectedProduct(null);
    if (newView !== VIEW_KEYS.TRACKING) window.scrollTo({ top: 0, behavior: "smooth" });
    const path = getPathFromView(newView);
    if (path) window.history.pushState(null, "", path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      let matchedView: string = VIEW_KEYS.HOME;
      for (const [key, val] of Object.entries(VIEW_PATH_MAP)) {
        if (val === path) matchedView = key;
      }
      setViewInternal(matchedView);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setViewInternal]);

  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem(STORE_STORAGE_KEY, selectedStore.id);
      fetchCart(selectedStore.id);
    }
  }, [selectedStore]);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setView(VIEW_KEYS.DETAIL);
  };

  const handleToggleWishlist = (product: any) => {
    const existing = wishlist.find((w: any) => w[0] === product[0]);
    let newW = existing ? wishlist.filter((w: any) => w[0] !== product[0]) : [...wishlist, product];
    setWishlist(newW);
    localStorage.setItem("sb_wishlist", JSON.stringify(newW));
  };

  const handleSelectStore = (store: any) => {
    setSelectedStore(store);
    setShowStorePopup(false);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setView(VIEW_KEYS.HOME);
    toast.success("Đăng nhập thành công!");
    if (selectedStore) fetchCart(selectedStore.id);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setCart([]);
    setView(VIEW_KEYS.HOME);
    toast.info("Đã đăng xuất.");
  };

  const handlePlaceOrder = async (customerInfo: any) => {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    const payload = {
      branchId: customerInfo.branchId || selectedStore?.id,
      shippingRecipientName: customerInfo.shippingRecipientName,
      shippingAddressPhone: customerInfo.shippingAddressPhone,
      shippingAddressStreet: customerInfo.shippingAddressStreet,
      shippingLatitude: customerInfo.shippingLatitude,
      shippingLongitude: customerInfo.shippingLongitude,
      shippingFee: customerInfo.shippingFee,
      paymentMethod: customerInfo.paymentMethod,
      fulfillmentType: customerInfo.fulfillmentType,
      note: customerInfo.note || "",
      couponCode: appliedCoupon?.code || null,
      items: cart.map((item: any) => {
        const unitPrice = item.price || parsePrice(item.product[1]);
        return {
          productId: item.productId || item.product?.raw?.id,
          variantId: item.variantId,
          productName: item.product[0],
          variantName: item.size || "M",
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity
        };
      })
    };
    try {
      const headers = cartHeaders(true);
      const res = await fetch(`${env.API_URL}/orders`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      const resData = await parseRes(res);
      if (!res.ok) throw new Error(resData?.message || "Đặt hàng thất bại");
      
      try {
        await fetch(`${env.API_URL}/cart?branchId=${selectedStore.id}`, { method: "DELETE", headers: cartHeaders() });
      } catch (err) { }
      
      setLastCreatedOrder(resData);
      if (resData?.id) rememberTrackingOrder(resData.id);
      setCart([]);
      setAppliedCoupon(null);
      toast.success("Đặt hàng thành công!");
      setView(VIEW_KEYS.SUCCESS);
    } catch (err: any) {
      toast.error(err.message || "Lỗi đặt hàng.");
      throw err;
    }
  };

  if ([VIEW_KEYS.ADMIN, VIEW_KEYS.STAFF, VIEW_KEYS.LOGIN, VIEW_KEYS.RESET_PASSWORD].includes(view)) {
    return (
      <>
        <Toaster richColors position="top-center" />
        <AppRoutes 
          view={view} setView={setView} setViewInternal={setViewInternal} 
          user={user} setUser={setUser} handleAdminLogout={handleLogout} handleLoginSuccess={handleLoginSuccess}
          products={products}
        />
      </>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <LoadingScreen isLoading={isLoading} />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Header
          view={view} setView={setView} navPages={NAV_PAGES}
          wishlistCount={wishlist.length} cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={() => setView("Tìm kiếm")}
          isLoggedIn={!!user} user={user} products={products} selectedStore={selectedStore}
          onChooseStore={() => setShowStorePopup(true)} onLogout={handleLogout}
        />
        <main className="min-h-[calc(100vh-400px)]">
          <AppRoutes 
            view={view} setView={setView} setViewInternal={setViewInternal} 
            user={user} setUser={setUser} cart={cart} handleUpdateCartQty={handleUpdateCartQty}
            handleRemoveCartItem={handleRemoveCartItem} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon}
            handlePlaceOrder={handlePlaceOrder} subtotal={subtotal} discount={discount} shipping={shipping} grandTotal={grandTotal}
            lastCreatedOrder={lastCreatedOrder} selectedProduct={selectedProduct} handleAddToCart={handleAddToCart}
            wishlist={wishlist} handleToggleWishlist={handleToggleWishlist} handleSelectProduct={handleSelectProduct}
            products={products} publicCoupons={publicCoupons} categories={categories} searchQuery={searchQuery}
            selectedOrderId={selectedOrderId} availableStores={availableStores} selectedStore={selectedStore}
            handleSelectStore={handleSelectStore} handleAdminLogout={handleLogout}
          />
        </main>
        <FloatingContact
          showOrderTracking={view === VIEW_KEYS.HOME}
          onTrackOrder={() => setView(VIEW_KEYS.TRACKING)}
        />
        {view === VIEW_KEYS.HOME && <SalesNotification products={products} onSelectProduct={handleSelectProduct} />}
        <Footer setView={setView} />
        {showStorePopup && (
          <StoreSelectionModal
            stores={availableStores} selectedStore={selectedStore}
            manualLocationRequired={manualLocationRequired} onSelect={handleSelectStore}
            onClose={() => setShowStorePopup(false)}
          />
        )}
      </div>
    </>
  );
}
