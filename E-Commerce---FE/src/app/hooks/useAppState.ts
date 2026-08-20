import { useState, useEffect, useCallback } from "react";
import { getOrderIdFromPath, getProductFromPath, getViewFromPath, apiProductToArray, apiCategoryToLegacy, STORE_STORAGE_KEY } from "../../utils/appUtils";
import { storeLocations as fallbackStoreLocations, type StoreLocation } from "../../data/storeLocations";
import { getAccessToken, getStoredUser } from "../components/authSession";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getActiveStores, getCustomerCoordinates, getNearbyStores } from "../features/stores/services/storeService";
import { getAvailableCoupons } from "../features/coupons/services/couponService";

export function useAppState() {
  const [view, setViewInternal] = useState<any>(() => getViewFromPath(window.location.pathname));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(() => getProductFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => getOrderIdFromPath(window.location.pathname));

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [couponRefreshKey, setCouponRefreshKey] = useState(0);

  const refreshPublicCoupons = useCallback(() => {
    setCouponRefreshKey((currentKey) => currentKey + 1);
  }, []);

  // Global Real-time polling for public vouchers & products
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPublicCoupons();
    }, 4500);

    const handleFocus = () => {
      refreshPublicCoupons();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshPublicCoupons]);

  // Global Real-time polling for User Points, Tier, & Profile updates
  useEffect(() => {
    if (!user?.id) return;

    const syncUserProfile = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [ptsRes, tierRes] = await Promise.all([
          fetch(`${env.API_URL}/points/my-points`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${env.API_URL}/points/loyalty-status`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        let hasChanges = false;
        const newUserState = { ...user };

        if (ptsRes.ok) {
          const ptsData = await parseRes(ptsRes);
          const pts = Number(ptsData?.points ?? user.points);
          if (pts !== user.points) {
            newUserState.points = pts;
            hasChanges = true;
          }
        }

        if (tierRes.ok) {
          const tierData = await parseRes(tierRes);
          if (tierData?.currentTier && JSON.stringify(tierData.currentTier) !== JSON.stringify(user.currentTier)) {
            newUserState.currentTier = tierData.currentTier;
            newUserState.tierId = tierData.currentTier.id;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          setUser(newUserState);
          localStorage.setItem("user", JSON.stringify(newUserState));
        }
      } catch (err) {
        // silent fail for polling errors
      }
    };

    const userInterval = setInterval(syncUserProfile, 3500);
    return () => clearInterval(userInterval);
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAvailableStores = async () => {
      // Capture this before geolocation resolves because App persists the temporary
      // fallback store while the real branch list is still loading.
      const previouslySavedStoreId = localStorage.getItem(STORE_STORAGE_KEY);
      try {
        let stores: StoreLocation[];
        let locationWasDetected = false;
        try {
          const coordinates = await getCustomerCoordinates();
          stores = await getNearbyStores(coordinates, controller.signal);
          locationWasDetected = true;
          setManualLocationRequired(false);
        } catch (locationError) {
          if (controller.signal.aborted) return;
          console.info("Không thể xác định vị trí khách hàng:", locationError);
          stores = await getActiveStores(controller.signal);
          setManualLocationRequired(true);
        }
        if (stores.length === 0) return;

        setAvailableStores(stores);
        setSelectedStore((currentStore) => {
          const nearestOpenStore = stores.find((store) => store.isOpenNow);

          if (locationWasDetected && nearestOpenStore) {
            return nearestOpenStore;
          }

          return (
            stores.find((store) => store.id === previouslySavedStoreId) ??
            nearestOpenStore ??
            stores.find((store) => store.id === currentStore?.id) ??
            stores[0]
          );
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Lỗi khi tải danh sách chi nhánh:", error);
        }
      }
    };

    void fetchAvailableStores();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let couponsList: any[] = [];
        try {
          couponsList = await getAvailableCoupons(selectedStore?.id, user?.id);
          setPublicCoupons(couponsList);
        } catch (err) {
          console.error("Lỗi khi tải vouchers:", err);
        }

        const [pRes, cRes] = await Promise.all([
          fetch(`${env.API_URL}/products`),
          fetch(`${env.API_URL}/products/categories`),
        ]);
        if (pRes.ok) {
          const raw = await parseRes(pRes);
          const apiProducts = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.products) ? raw.products : []));
          setProducts(apiProducts.map(p => apiProductToArray(p, couponsList)));
        }
        if (cRes.ok) {
          const raw = await parseRes(cRes);
          const apiCategories = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.categories) ? raw.categories : []));
          setCategories(apiCategories.map(apiCategoryToLegacy));
        }
      } catch {
        // Keep empty fallback data if the API is unavailable.
      }
    })();
  }, [couponRefreshKey, selectedStore?.id, user?.id]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/chi-tiet/') && products.length > 0) {
      setSelectedProduct(getProductFromPath(path, products));
    }
    if (path.startsWith('/danh-muc/') && categories.length > 0) {
      setViewInternal(getViewFromPath(path, categories));
    }
  }, [categories, products]);

  return {
    view, setViewInternal, isLoading, setIsLoading,
    selectedProduct, setSelectedProduct, searchQuery, setSearchQuery,
    wishlist, setWishlist, user, setUser,
    selectedStore, setSelectedStore, availableStores, setAvailableStores,
    showStorePopup, setShowStorePopup, manualLocationRequired, setManualLocationRequired,
    lastCreatedOrder, setLastCreatedOrder, selectedOrderId, setSelectedOrderId,
    products, setProducts, categories, setCategories, publicCoupons, setPublicCoupons,
    refreshPublicCoupons,
  };
}
