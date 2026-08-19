import { useMemo, useState } from "react";
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

  const couponOptions = useMemo(
    () => {
      const totalCartQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

      return coupons
        .map((coupon) => {
          let unavailableReason = "";
          if (subtotal < Number(coupon.minOrderValue || 0)) {
            unavailableReason = `Đơn tối thiểu ${Number(coupon.minOrderValue || 0).toLocaleString("vi-VN")}đ`;
          } else if (coupon.minQuantity && totalCartQuantity < Number(coupon.minQuantity)) {
            unavailableReason = `Yêu cầu mua tối thiểu ${coupon.minQuantity} sản phẩm`;
          } else if (
            coupon.productId &&
            !cart.some(
              (item) =>
                (item.productId || (item.product as { raw?: { id?: string } })?.raw?.id) ===
                coupon.productId,
            )
          ) {
            unavailableReason = "Không áp dụng cho sản phẩm trong đơn";
          } else if (
            coupon.categoriesId &&
            !cart.some((item) => {
              const product = item.product?.raw;
              return (
                product?.categoryId === coupon.categoriesId ||
                product?.categoriesId === coupon.categoriesId ||
                product?.category?.id === coupon.categoriesId
              );
            })
          ) {
            unavailableReason = "Không áp dụng cho danh mục trong đơn";
          } else if (
            coupon.targetSize &&
            !cart.some((item) => matchSize(item.size || "", coupon.targetSize || ""))
          ) {
            unavailableReason = `Chỉ áp dụng cho size ${coupon.targetSize}`;
          }

          return {
            ...coupon,
            isApplicable: !unavailableReason,
            unavailableReason,
          };
        })
        .sort((left, right) => Number(right.isApplicable) - Number(left.isApplicable));
    },
    [cart, coupons, subtotal],
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
