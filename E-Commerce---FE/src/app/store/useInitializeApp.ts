import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { useCartStore } from './useCartStore';
import { useProductStore } from './useProductStore';
import { useLocationStore } from './useLocationStore';
import { ProductService } from '../../services/product.service';
import { BranchService } from '../../services/branch.service';
import { apiProductToArray, apiCategoryToLegacy } from '../../utils/mappers';
const fallbackStoreLocations: any[] = [];

export const useInitializeApp = () => {
  const { checkSession, user } = useAuthStore();
  const { setProducts, setCategories, setPublicCoupons } = useProductStore();
  const { setAvailableStores, setSelectedStore, showStorePopup } = useLocationStore();
  const { fetchCart, cartSessionId } = useCartStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    (async () => {
      try {
        const couponsList = await ProductService.fetchPublicCoupons();
        setPublicCoupons(couponsList);
        
        const products = await ProductService.fetchProducts();
        setProducts(products.map((p: any) => apiProductToArray(p, couponsList)));
        
        const categories = await ProductService.fetchCategories();
        setCategories(categories.map(apiCategoryToLegacy));
      } catch (err) {
        console.error("Failed to load initial product data", err);
      }
    })();
  }, [setProducts, setCategories, setPublicCoupons]);

  // Load branches
  useEffect(() => {
    (async () => {
      try {
        const branches = await BranchService.fetchActiveBranches();
        if (branches && branches.length > 0) {
            const mappedBranches = branches.map((b: any) => ({
                id: b.id,
                name: b.name,
                shortName: b.name?.replace(/^Sweet Bean\s*/i, "") || b.name,
                address: b.address,
                phone: b.phone || "",
                hours: b.todayOpeningHour && !b.todayOpeningHour.isClosed
                  ? `${b.todayOpeningHour.openingTime?.slice(0, 5)} - ${b.todayOpeningHour.closingTime?.slice(0, 5)}`
                  : "Đóng cửa hôm nay",
                distance: "Đang tính",
                delivery: "Chưa tính",
                status: b.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa",
                highlight: "Chi nhánh đang phục vụ",
                mapQuery: b.address || b.name,
                isOpenNow: !!b.isOpenNow,
                todayOpeningHour: b.todayOpeningHour ?? null,
            }));
            setAvailableStores(mappedBranches);
        } else {
            setAvailableStores(fallbackStoreLocations);
        }
      } catch (err) {
        setAvailableStores(fallbackStoreLocations);
      }
    })();
  }, [setAvailableStores]);
};
