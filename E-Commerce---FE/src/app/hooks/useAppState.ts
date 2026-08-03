import { useState, useEffect, useCallback } from "react";
import { getProductFromPath, getViewFromPath, apiProductToArray, apiCategoryToLegacy, STORE_STORAGE_KEY } from "../../utils/appUtils";
import { storeLocations as fallbackStoreLocations, type StoreLocation } from "../../data/storeLocations";
import { getStoredUser } from "../components/authSession";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [couponRefreshKey, setCouponRefreshKey] = useState(0);

  const refreshPublicCoupons = useCallback(() => {
    setCouponRefreshKey((currentKey) => currentKey + 1);
  }, []);

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
          couponsList = await getAvailableCoupons(selectedStore?.id);
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
