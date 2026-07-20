import { useState, useEffect } from 'react';
import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { storeLocations as fallbackStoreLocations, type StoreLocation } from '../../../../data/storeLocations';
import { getDiscountedPrice } from '../../../components/shared';

// Helper mapping functions
export const apiProductToArray = (p: any, coupons: any[] = []): any[] => {
  const activeVariants = (p.variants || [])
    .filter((variant: any) => variant.status === "active")
    .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  const originalPrice = activeVariants[0]?.price ? Number(activeVariants[0].price) : 0;
  const price = originalPrice ? `${originalPrice.toLocaleString("vi-VN")}đ` : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = "4.8";
  const badge = p.productType === "combo"
    ? "Combo"
    : activeVariants.length > 1
      ? `${activeVariants.length} kích cỡ`
      : activeVariants.length === 1 ? "Còn hàng" : "Hết hàng";

  let sizeStr = activeVariants[0]?.size || "Vừa";
  if (sizeStr.includes("(")) {
    sizeStr = sizeStr.split("(")[0].trim();
  }

  const { discountedPrice, discountAmount, bestCoupon } = getDiscountedPrice(originalPrice, p, coupons, sizeStr);
  const discountPriceStr = discountAmount > 0 ? `${discountedPrice.toLocaleString("vi-VN")}đ` : null;

  const arr = [p.name, price, categoryName, imageUrl, rating, badge, discountPriceStr, bestCoupon?.code];
  (arr as any).raw = p;
  return arr;
};

export const apiCategoryToLegacy = (c: any) => ({
  name: c.name,
  icon: "",
  img: c.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=180&fit=crop&auto=format",
});

const estimateDelivery = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") return "Chưa tính";
  const minMinutes = Math.max(25, Math.ceil(22 + distanceKm * 4));
  const maxMinutes = minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);
  return `${minMinutes}-${maxMinutes} phút`;
};

export const apiBranchToStore = (branch: any): StoreLocation => {
  const distanceKm = typeof branch.distanceKm === "number" ? branch.distanceKm : undefined;
  const todayHours = branch.todayOpeningHour;
  const hours = todayHours && !todayHours.isClosed
    ? `${todayHours.openingTime?.slice(0, 5)} - ${todayHours.closingTime?.slice(0, 5)}`
    : "Đóng cửa hôm nay";

  return {
    id: branch.id,
    name: branch.name,
    shortName: branch.name?.replace(/^Sweet Bean\s*/i, "") || branch.name,
    address: branch.address,
    phone: branch.phone || "",
    hours,
    distance: typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km` : "Đang tính",
    delivery: branch.deliveryEstimate || estimateDelivery(distanceKm),
    status: branch.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa",
    highlight: typeof distanceKm === "number" ? "Gần bạn nhất" : "Chi nhánh đang phục vụ",
    mapQuery: branch.address || branch.name,
    isOpenNow: !!branch.isOpenNow,
    todayOpeningHour: todayHours ?? null,
  };
};

export const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);

export const LISTABLE = [
  "Trang chủ", "Bánh ngọt", "Combo",
  "Bánh sinh nhật", "Bánh mousse", "Bánh tart", "Bánh quy",
  "Cafe", "Trà", "Đồ uống khác", "Tìm kiếm",
];

const STORE_STORAGE_KEY = "sb_selected_store";

export function useAppInit() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  
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

  // Load products, categories, coupons
  useEffect(() => {
    (async () => {
      try {
        let couponsList: any[] = [];
        try {
          const couponRes = await fetch(`${env.API_URL}/coupons/public`);
          if (couponRes.ok) {
            couponsList = await parseRes(couponRes);
            setPublicCoupons(couponsList);
          }
        } catch (err) {
          console.error("Lỗi khi tải vouchers:", err);
        }

        const [pRes, cRes] = await Promise.all([
          fetch(`${env.API_URL}/products`),
          fetch(`${env.API_URL}/products/categories`),
        ]);
        if (pRes.ok) {
          const apiProducts = await parseRes(pRes);
          setProducts(apiProducts.map((p: any) => apiProductToArray(p, couponsList)));
        }
        if (cRes.ok) {
          const apiCategories = await parseRes(cRes);
          setCategories(apiCategories.map(apiCategoryToLegacy));
        }
      } catch {
        // Keep empty fallback data if the API is unavailable.
      }
    })();
  }, []);

  return {
    products,
    categories,
    publicCoupons,
    selectedStore,
    setSelectedStore,
    availableStores,
    setAvailableStores,
    showStorePopup,
    setShowStorePopup,
    manualLocationRequired
  };
}
