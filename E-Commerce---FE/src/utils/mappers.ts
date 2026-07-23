// Mapped utilities to prevent importing from legacy useAppInit
export const getDiscountedPrice = (originalPrice: number, product: any, publicCoupons: any[], selectedSize: string) => {
  let discountedPrice = originalPrice;
  let bestCoupon = null;
  let maxDiscountAmount = 0;

  for (const coupon of publicCoupons) {
    const isProductMatch = !coupon.productId || coupon.productId === product.id;
    let isCategoryMatch = !coupon.categoriesId || coupon.categoriesId === product.categoryId || coupon.categoriesId === product.category?.id;
    const isSizeMatch = !coupon.targetSize || selectedSize.toLowerCase().startsWith(coupon.targetSize.toLowerCase());

    if (isProductMatch && isCategoryMatch && isSizeMatch) {
      let discountAmount = 0;
      if (coupon.discountType === "percent") {
        discountAmount = Math.round(originalPrice * (Number(coupon.discountValue) / 100));
        if (coupon.maxDiscount && Number(coupon.maxDiscount) > 0) {
          discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }

      if (discountAmount > maxDiscountAmount) {
        maxDiscountAmount = discountAmount;
        bestCoupon = coupon;
      }
    }
  }

  discountedPrice = Math.max(0, originalPrice - maxDiscountAmount);
  return { discountedPrice, discountAmount: maxDiscountAmount, bestCoupon };
};

export const apiProductToArray = (p: any, coupons: any[] = []): any[] => {
  const activeVariants = (p.variants || [])
    .filter((variant: any) => variant.status === "active")
    .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  const originalPrice = activeVariants[0]?.price ? Number(activeVariants[0].price) : 0;
  const price = originalPrice ? `${originalPrice.toLocaleString("vi-VN")}đ` : "0đ";
  const categoryName = p.category?.name ?? "Khác";
  const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
  const rating = p.rating ? Number(p.rating).toFixed(1) : "0.0";
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
