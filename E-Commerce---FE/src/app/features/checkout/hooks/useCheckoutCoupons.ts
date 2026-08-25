import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { matchSize } from "../../../../utils/appUtils";

interface CheckoutCoupon {
  id: string;
  code: string;
  description?: string;
  minOrderValue?: number | string;
  minQuantity?: number | string;
  discountType: "percent" | "fixed";
  discountValue: number | string;
  maxDiscount?: number | string;
  productId?: string;
  categoriesId?: string;
  targetSize?: string;
  applicableTierId?: string;
  applicableTier?: { id?: string; name?: string; tierLevel?: number };
}

interface CheckoutCartItem {
  productId?: string;
  size?: string;
  quantity?: number;
  product?: {
    raw?: {
      id?: string;
      categoryId?: string;
      categoriesId?: string;
      category?: { id?: string };
    };
  };
}

interface UseCheckoutCouponsParams {
  coupons: CheckoutCoupon[];
  cart: CheckoutCartItem[];
  subtotal: number;
  user: unknown;
  appliedCoupon: CheckoutCoupon | null;
  setAppliedCoupon: (coupon: CheckoutCoupon | null) => void;
}

export function useCheckoutCoupons({
  coupons,
  cart,
  subtotal,
  user,
  appliedCoupon,
  setAppliedCoupon,
}: UseCheckoutCouponsParams) {
  const [isOpen, setIsOpen] = useState(false);

  const userTierLevel = Number((user as any)?.currentTier?.tierLevel || (user as any)?.tier?.tierLevel || (user as any)?.tierLevel || (user as any)?.tier_level || 1);
  const userTierId = (user as any)?.currentTier?.id || (user as any)?.tier?.id || (user as any)?.tierId || (user as any)?.tier_id;

  // Real-time automatic re-validation of applied coupon during checkout
  useEffect(() => {
    if (!appliedCoupon) return;

    let invalidReason = "";

    // 1. Check exact tier requirement
    if (appliedCoupon.applicableTierId) {
      const reqTierLevel = Number(appliedCoupon.applicableTier?.tierLevel || 1);
      const reqTierId = appliedCoupon.applicableTierId || appliedCoupon.applicableTier?.id;
      const isExactTierMatch = userTierId ? userTierId === reqTierId : userTierLevel === reqTierLevel;

      if (!user || !isExactTierMatch) {
        const tierName = appliedCoupon.applicableTier?.name || "khác";
        invalidReason = `Mã ${appliedCoupon.code} chỉ dành riêng cho Hạng ${tierName}.`;
      }
    }

    // 2. Check min order value
    if (!invalidReason && subtotal < Number(appliedCoupon.minOrderValue || 0)) {
      invalidReason = `Đơn chưa đạt mức tối thiểu ${Number(appliedCoupon.minOrderValue || 0).toLocaleString("vi-VN")}đ.`;
    }

    // 3. Check matching items & min quantity
    if (!invalidReason) {
      const matchingItems = cart.filter((item) => {
        const isProductMatch = !appliedCoupon.productId || (item.productId || (item.product as { raw?: { id?: string } })?.raw?.id) === appliedCoupon.productId;
        const product = item.product?.raw;
        const isCategoryMatch = !appliedCoupon.categoriesId || (
          product?.categoryId === appliedCoupon.categoriesId ||
          product?.categoriesId === appliedCoupon.categoriesId ||
          product?.category?.id === appliedCoupon.categoriesId
        );
        const isSizeMatch = !appliedCoupon.targetSize || matchSize(item.size || "", appliedCoupon.targetSize || "");
        return isProductMatch && isCategoryMatch && isSizeMatch;
      });

      if (matchingItems.length === 0 && (appliedCoupon.productId || appliedCoupon.categoriesId || appliedCoupon.targetSize)) {
        invalidReason = `Đơn không có sản phẩm áp dụng mã ${appliedCoupon.code}.`;
      } else {
        const matchingQuantity = matchingItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
        if (appliedCoupon.minQuantity && matchingQuantity < Number(appliedCoupon.minQuantity)) {
          invalidReason = `Cần mua tối thiểu ${appliedCoupon.minQuantity} SP hợp lệ (bạn có ${matchingQuantity} SP).`;
        }
      }
    }

    if (invalidReason) {
      setAppliedCoupon(null);
      toast.error(`${invalidReason} Đã gỡ mã giảm giá.`);
    }
  }, [cart, subtotal, user, appliedCoupon, setAppliedCoupon, userTierId, userTierLevel]);

  const couponOptions = useMemo(
    () => {
      return coupons
        .map((coupon: any) => {
          let unavailableReason = "";

          // Check exact tier requirement
          const reqTierLevel = Number(coupon.applicableTier?.tierLevel || 1);
          const reqTierId = coupon.applicableTierId || coupon.applicableTier?.id;
          const isExactTierMatch = userTierId ? userTierId === reqTierId : userTierLevel === reqTierLevel;

          if (coupon.applicableTierId && (!user || !isExactTierMatch)) {
            const tierName = coupon.applicableTier?.name || "khác";
            unavailableReason = `Chỉ dành riêng cho Hạng ${tierName}`;
          } else if (subtotal < Number(coupon.minOrderValue || 0)) {
            unavailableReason = `Đơn tối thiểu ${Number(coupon.minOrderValue || 0).toLocaleString("vi-VN")}đ`;
          } else {
            const matchingItems = cart.filter((item) => {
              const isProductMatch = !coupon.productId || (item.productId || (item.product as { raw?: { id?: string } })?.raw?.id) === coupon.productId;
              const product = item.product?.raw;
              const isCategoryMatch = !coupon.categoriesId || (
                product?.categoryId === coupon.categoriesId ||
                product?.categoriesId === coupon.categoriesId ||
                product?.category?.id === coupon.categoriesId
              );
              const isSizeMatch = !coupon.targetSize || matchSize(item.size || "", coupon.targetSize || "");
              return isProductMatch && isCategoryMatch && isSizeMatch;
            });

            if (matchingItems.length === 0 && (coupon.productId || coupon.categoriesId || coupon.targetSize)) {
              unavailableReason = "Không áp dụng cho sản phẩm trong đơn";
            } else {
              const matchingQuantity = matchingItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
              if (coupon.minQuantity && matchingQuantity < Number(coupon.minQuantity)) {
                unavailableReason = `Cần mua tối thiểu ${coupon.minQuantity} SP hợp lệ (bạn có ${matchingQuantity} SP)`;
              }
            }
          }

          return {
            ...coupon,
            isApplicable: !unavailableReason,
            unavailableReason,
          };
        })
        .sort((left, right) => Number(right.isApplicable) - Number(left.isApplicable));
    },
    [cart, coupons, subtotal, user, userTierId, userTierLevel],
  );

  const selectCoupon = (coupon: (typeof couponOptions)[number]) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng mã giảm giá.");
      return;
    }
    if (!coupon.isApplicable) {
      toast.error(coupon.unavailableReason);
      return;
    }
    setAppliedCoupon(coupon);
    setIsOpen(false);
    toast.success(`Đã áp dụng mã ${coupon.code}!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setIsOpen(false);
    toast.success("Đã bỏ mã giảm giá.");
  };

  return {
    isOpen,
    setIsOpen,
    couponOptions,
    appliedCoupon,
    selectCoupon,
    removeCoupon,
  };
}
