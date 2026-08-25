import { Award, Check, ChevronRight, Minus, Plus, Ticket, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VIEW_KEYS } from "../../config/appConfig";
import { matchSize } from "../../utils/appUtils";
import { Btn } from "../components/shared";

const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Cart({ cart: rawCart = [], onUpdateQty, onRemoveItem, setView, publicCoupons: rawCoupons = [], appliedCoupon, setAppliedCoupon, user }: any) {
  const cart = Array.isArray(rawCart) ? rawCart : (Array.isArray(rawCart?.data) ? rawCart.data : []);
  const publicCoupons = Array.isArray(rawCoupons) ? rawCoupons : (Array.isArray(rawCoupons?.data) ? rawCoupons.data : []);
  const [coupon, setCoupon] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const updateQty = (index: number, delta: number) => {
    const item = cart[index];
    if (item) {
      const newQty = Math.max(1, item.quantity + delta);
      onUpdateQty(index, newQty);
    }
  };

  const removeCartItem = (index: number) => {
    onRemoveItem(index);
  };

  const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    const matchingItems = cart.filter((item: any) => {
      const isProductMatch = !appliedCoupon.productId || (item.productId || item.product?.raw?.id) === appliedCoupon.productId;
      const isCategoryMatch = !appliedCoupon.categoriesId || (
        item.product?.raw?.categoryId === appliedCoupon.categoriesId ||
        item.product?.raw?.categoriesId === appliedCoupon.categoriesId ||
        item.product?.raw?.category?.id === appliedCoupon.categoriesId
      );
      const isSizeMatch = !appliedCoupon.targetSize || matchSize(item.size, appliedCoupon.targetSize);
      return isProductMatch && isCategoryMatch && isSizeMatch;
    });

    const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);

    if (matchingItems.length > 0) {
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(matchingSubtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(matchingSubtotal, Number(appliedCoupon.discountValue));
      }
    }
  }

  const grandTotal = Math.max(0, subtotal - discount);

  const userTierLevel = Number(user?.currentTier?.tierLevel || user?.tier?.tierLevel || user?.tierLevel || user?.tier_level || 1);
  const userTierId = user?.currentTier?.id || user?.tier?.id || user?.tierId || user?.tier_id;

  // Real-time automatic re-validation of applied coupon whenever cart, subtotal, or user changes
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
        invalidReason = `Mã giảm giá ${appliedCoupon.code} chỉ dành riêng cho Hạng ${tierName}.`;
      }
    }

    // 2. Check min order value
    if (!invalidReason && subtotal < Number(appliedCoupon.minOrderValue || 0)) {
      invalidReason = `Đơn hàng chưa đạt mức tối thiểu ${formatPrice(Number(appliedCoupon.minOrderValue))}.`;
    }

    // 3. Check matching items & min quantity
    if (!invalidReason) {
      const matchingItems = cart.filter((item: any) => {
        const isProductMatch = !appliedCoupon.productId || (item.productId || item.product?.raw?.id) === appliedCoupon.productId;
        const isCategoryMatch = !appliedCoupon.categoriesId || (
          item.product?.raw?.categoryId === appliedCoupon.categoriesId ||
          item.product?.raw?.categoriesId === appliedCoupon.categoriesId ||
          item.product?.raw?.category?.id === appliedCoupon.categoriesId
        );
        const isSizeMatch = !appliedCoupon.targetSize || matchSize(item.size, appliedCoupon.targetSize);
        return isProductMatch && isCategoryMatch && isSizeMatch;
      });

      if (matchingItems.length === 0 && (appliedCoupon.productId || appliedCoupon.categoriesId || appliedCoupon.targetSize)) {
        invalidReason = `Giỏ hàng không có sản phẩm áp dụng mã ${appliedCoupon.code}.`;
      } else {
        const matchingQuantity = matchingItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
        if (appliedCoupon.minQuantity && matchingQuantity < Number(appliedCoupon.minQuantity)) {
          invalidReason = `Mã ${appliedCoupon.code} yêu cầu tối thiểu ${appliedCoupon.minQuantity} SP hợp lệ (hiện có ${matchingQuantity} SP).`;
        }
      }
    }

    if (invalidReason) {
      setAppliedCoupon(null);
      toast.error(`${invalidReason} Đã tự động gỡ mã giảm giá.`);
    }
  }, [cart, subtotal, user, appliedCoupon, setAppliedCoupon, userTierId, userTierLevel]);

  const applyCoupon = () => {
    if (!coupon.trim()) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng mã giảm giá.");
      return;
    }
    const found = publicCoupons.find((c: any) => c.code.toUpperCase().trim() === coupon.toUpperCase().trim());
    if (!found) {
      toast.error("Mã giảm giá không hợp lệ, đã hết hạn hoặc bạn đã sử dụng rồi.");
      return;
    }

    // 1. Check Exact Tier Requirement
    const reqTierLevel = Number(found.applicableTier?.tierLevel || 1);
    const reqTierId = found.applicableTierId || found.applicableTier?.id;
    const isExactTierMatch = userTierId ? userTierId === reqTierId : userTierLevel === reqTierLevel;

    if (found.applicableTierId && !isExactTierMatch) {
      const tierName = found.applicableTier?.name || "khác";
      const currentTierName = user?.currentTier?.name || user?.tier?.name || "Đồng";
      toast.error(`Mã giảm giá ${found.code} chỉ dành riêng cho Hạng ${tierName} (Tài khoản hiện ở Hạng ${currentTierName}).`);
      return;
    }

    // 2. Check Min Order Value
    if (subtotal < Number(found.minOrderValue || 0)) {
      toast.error(`Đơn hàng tối thiểu để áp dụng mã này là ${formatPrice(Number(found.minOrderValue))}.`);
      return;
    }

    // 3. Find matching items & check Product/Category/Size & Min Quantity
    const matchingItems = cart.filter((item: any) => {
      const isProductMatch = !found.productId || (item.productId || item.product?.raw?.id) === found.productId;
      const isCategoryMatch = !found.categoriesId || (
        item.product?.raw?.categoryId === found.categoriesId ||
        item.product?.raw?.categoriesId === found.categoriesId ||
        item.product?.raw?.category?.id === found.categoriesId
      );
      const isSizeMatch = !found.targetSize || matchSize(item.size, found.targetSize);
      return isProductMatch && isCategoryMatch && isSizeMatch;
    });

    if (found.productId && !cart.some((item: any) => (item.productId || item.product?.raw?.id) === found.productId)) {
      toast.error("Mã này chỉ áp dụng cho sản phẩm nhất định.");
      return;
    }

    if (found.categoriesId && !cart.some((item: any) => {
      const prod = item.product?.raw;
      return prod && (prod.categoryId === found.categoriesId || prod.categoriesId === found.categoriesId || prod.category?.id === found.categoriesId);
    })) {
      toast.error("Mã này chỉ áp dụng cho danh mục sản phẩm nhất định.");
      return;
    }

    if (found.targetSize && !cart.some((item: any) => matchSize(item.size, found.targetSize))) {
      toast.error(`Mã này chỉ áp dụng cho sản phẩm size ${found.targetSize}.`);
      return;
    }

    const matchingQuantity = matchingItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
    if (found.minQuantity && matchingQuantity < Number(found.minQuantity)) {
      toast.error(`Mã ${found.code} yêu cầu mua tối thiểu ${found.minQuantity} sản phẩm hợp lệ (bạn hiện có ${matchingQuantity} SP trong giỏ).`);
      return;
    }

    const isReplacement = !!appliedCoupon;
    setAppliedCoupon(found);
    toast.success(
      isReplacement
        ? `Đã thay thế mã giảm giá cũ. Áp dụng mã ${found.code} thành công!`
        : `Áp dụng mã giảm giá ${found.code} thành công!`
    );
  };

  // Find best coupon suggestion
  let bestCouponSuggestion: any = null;
  let bestCouponDiscount = 0;

  if (Array.isArray(publicCoupons) && cart.length > 0) {
    publicCoupons.forEach((c: any) => {
      // Check exact tier match
      if (c.applicableTierId) {
        const reqTierLevel = Number(c.applicableTier?.tierLevel || 1);
        const reqTierId = c.applicableTierId || c.applicableTier?.id;
        const isExactTierMatch = userTierId ? userTierId === reqTierId : userTierLevel === reqTierLevel;
        if (!user || !isExactTierMatch) return;
      }

      if (subtotal < Number(c.minOrderValue || 0)) return;

      const matchingItems = cart.filter((item: any) => {
        const isProductMatch = !c.productId || (item.productId || item.product?.raw?.id) === c.productId;
        const isCategoryMatch = !c.categoriesId || (
          item.product?.raw?.categoryId === c.categoriesId ||
          item.product?.raw?.categoriesId === c.categoriesId ||
          item.product?.raw?.category?.id === c.categoriesId
        );
        const isSizeMatch = !c.targetSize || matchSize(item.size, c.targetSize);
        return isProductMatch && isCategoryMatch && isSizeMatch;
      });

      if (matchingItems.length === 0) return;

      const matchingQuantity = matchingItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
      if (c.minQuantity && matchingQuantity < Number(c.minQuantity)) return;

      const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);

      let currentDiscount = 0;
      if (c.discountType === "percent") {
        currentDiscount = Math.round(matchingSubtotal * (Number(c.discountValue) / 100));
        if (c.maxDiscount && Number(c.maxDiscount) > 0) {
          currentDiscount = Math.min(currentDiscount, Number(c.maxDiscount));
        }
      } else {
        currentDiscount = Math.min(matchingSubtotal, Number(c.discountValue));
      }

      if (currentDiscount > bestCouponDiscount) {
        bestCouponDiscount = currentDiscount;
        bestCouponSuggestion = c;
      }
    });
  }

  const sortedCoupons = [...(publicCoupons || [])].map((c: any) => {
    let isApplicable = true;

    if (c.applicableTierId) {
      const reqTierLevel = Number(c.applicableTier?.tierLevel || 1);
      const reqTierId = c.applicableTierId || c.applicableTier?.id;
      const isExactTierMatch = userTierId ? userTierId === reqTierId : userTierLevel === reqTierLevel;
      if (!user || !isExactTierMatch) isApplicable = false;
    }

    if (isApplicable && subtotal < Number(c.minOrderValue || 0)) isApplicable = false;

    const matchingItems = cart.filter((item: any) => {
      const isProductMatch = !c.productId || (item.productId || item.product?.raw?.id) === c.productId;
      const isCategoryMatch = !c.categoriesId || (
        item.product?.raw?.categoryId === c.categoriesId ||
        item.product?.raw?.categoriesId === c.categoriesId ||
        item.product?.raw?.category?.id === c.categoriesId
      );
      const isSizeMatch = !c.targetSize || matchSize(item.size, c.targetSize);
      return isProductMatch && isCategoryMatch && isSizeMatch;
    });

    if (isApplicable && matchingItems.length === 0 && (c.productId || c.categoriesId || c.targetSize)) {
      isApplicable = false;
    }

    const matchingQuantity = matchingItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);
    if (isApplicable && c.minQuantity && matchingQuantity < Number(c.minQuantity)) {
      isApplicable = false;
    }

    return { ...c, isApplicable };
  }).sort((a: any, b: any) => {
    if (a.isApplicable && !b.isApplicable) return -1;
    if (!a.isApplicable && b.isApplicable) return 1;

    const getAmt = (c: any) => c.discountType === 'percent' ? (subtotal * Number(c.discountValue) / 100) : Number(c.discountValue);
    return getAmt(b) - getAmt(a);
  });

  const estimatedPoints = Math.floor(Math.max(0, subtotal - discount) / 1000);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl font-bold font-serif">Giỏ hàng của bạn</h2>
      {cart.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 rounded-2xl border bg-card p-4 items-center">
                <img src={item.product[3]} alt="" className="size-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base line-clamp-1">{item.product[0]}</h3>
                  <p className="text-xs text-muted-foreground">Kích cỡ: {item.size}</p>
                  {item.options && (
                    <div className="text-[11px] text-muted-foreground/80 space-y-0.5 mt-1">
                      {item.options.sugar && <div>Đường: {item.options.sugar}</div>}
                      {item.options.ice && <div>Đá: {item.options.ice}</div>}
                      {item.options.comboDrinkOptions && Object.values(item.options.comboDrinkOptions).map((option: any, optionIndex) => (
                        <div key={`${option.productName}-${optionIndex}`}>
                          {option.productName}: đường {option.sugar}, đá {option.ice}
                          {option.toppings && option.toppings.length > 0 && ` + Topping: ${option.toppings.join(", ")}`}
                        </div>
                      ))}
                      {item.options.toppings && item.options.toppings.length > 0 && (
                        <div>Topping: {item.options.toppings.join(", ")}</div>
                      )}
                      {item.options.customText && <div>Ghi chú: "{item.options.customText}"</div>}
                      {item.options.needCandles && <div>Lấy nến sinh nhật</div>}
                    </div>
                  )}
                  <p className="text-primary font-bold mt-1.5">{item.price ? formatPrice(item.price) : item.product[1]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQty(i, -1)} className="size-8 border rounded-lg flex items-center justify-center hover:bg-secondary">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(i, 1)} className="size-8 border rounded-lg flex items-center justify-center hover:bg-secondary">
                    <Plus size={12} />
                  </button>
                </div>
                <button onClick={() => removeCartItem(i)} className="text-muted-foreground hover:text-red-500 p-2 transition shrink-0">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-6 h-fit space-y-4">
            <h3 className="font-bold text-lg font-serif">Đơn hàng</h3>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="flex items-center justify-between w-full rounded-xl border bg-input px-4 py-3 text-sm hover:border-primary transition min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Ticket className="text-primary shrink-0" size={20} />
                {appliedCoupon ? (
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-bold text-foreground text-xs sm:text-sm flex flex-wrap items-center gap-1">
                      <span>Mã giảm giá:</span>
                      <span className="text-primary font-mono font-extrabold break-all">{appliedCoupon.code}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Đã áp dụng thành công</p>
                  </div>
                ) : (
                  <span className="font-medium text-muted-foreground truncate">Chọn hoặc nhập mã ưu đãi</span>
                )}
              </div>
              <ChevronRight className="text-muted-foreground shrink-0 ml-2" size={20} />
            </button>

            {bestCouponSuggestion && (!appliedCoupon || appliedCoupon.id !== bestCouponSuggestion.id) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-2 min-w-0">
                <p className="text-muted-foreground flex items-start gap-1.5 leading-relaxed break-all">
                  <span className="animate-bounce shrink-0">💡</span>
                  {user ? (
                    <span>Gợi ý: Dùng mã <strong className="text-primary font-mono font-bold break-all">{bestCouponSuggestion.code}</strong> để được giảm thêm <strong className="text-primary font-bold">{formatPrice(bestCouponDiscount)}</strong>!</span>
                  ) : (
                    <span>Gợi ý: Đăng nhập để dùng mã <strong className="text-primary font-mono font-bold break-all">{bestCouponSuggestion.code}</strong> giảm thêm <strong className="text-primary font-bold">{formatPrice(bestCouponDiscount)}</strong>!</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setView(VIEW_KEYS.LOGIN);
                    } else {
                      setCoupon(bestCouponSuggestion.code);
                      setAppliedCoupon(bestCouponSuggestion);
                      toast.success(`Đã áp dụng mã gợi ý ${bestCouponSuggestion.code}!`);
                    }
                  }}
                  className="w-full text-left text-primary font-bold hover:underline cursor-pointer"
                >
                  {user ? "Áp dụng ngay" : "Đăng nhập ngay"}
                </button>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl px-3 py-2 text-xs min-w-0 gap-2">
                <span className="min-w-0 flex-1 break-all leading-normal">
                  Đã áp dụng: <strong className="font-mono font-extrabold">{appliedCoupon.code}</strong> <span className="font-bold">(-{formatPrice(discount)})</span>
                </span>
                <button type="button" onClick={() => setAppliedCoupon(null)} className="text-muted-foreground hover:text-red-500 font-bold shrink-0 cursor-pointer">Gỡ</button>
              </div>
            )}

            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium"><span>Giảm giá</span><span>-{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span className="text-muted-foreground">Đang tính</span>
              </div>
              {estimatedPoints > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 my-1">
                  <span className="flex items-center gap-1.5">
                    <Award size={15} className="text-amber-500 shrink-0" />
                    <span>Điểm thưởng tích lũy:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">+{estimatedPoints} điểm</span>
                </div>
              )}
              <hr className="my-2 border-border" />
              <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="text-primary">{formatPrice(grandTotal)}</span></div>
            </div>
            <Btn onClick={() => setView(VIEW_KEYS.CHECKOUT)} className="w-full">Tiến hành thanh toán</Btn>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground border border-dashed rounded-3xl">
          Giỏ hàng của bạn đang trống.
          <button onClick={() => setView(VIEW_KEYS.HOME)} className="mt-4 block mx-auto text-primary underline font-medium">Tiếp tục mua sắm</button>
        </div>
      )}

      {/* Coupon Selection Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[min(85vh,38rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:p-4">
              <h3 className="font-bold text-lg">Khuyến mãi</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-secondary transition text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="shrink-0 border-b bg-secondary/30 p-3 sm:p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="relative min-w-0">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Nhập mã khuyến mãi..."
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    className="w-full min-w-0 rounded-xl border bg-background py-2.5 pl-9 pr-2 text-xs uppercase outline-none focus:border-primary sm:pr-3 sm:text-sm"
                  />
                </div>
                <button 
                  onClick={() => {
                    applyCoupon();
                    if (coupon.trim() && user && publicCoupons.some((c: any) => c.code.toUpperCase() === coupon.toUpperCase().trim())) {
                       setIsCouponModalOpen(false);
                    }
                  }} 
                  className="whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/80 sm:px-5 sm:text-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 sm:space-y-3 sm:p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
              {sortedCoupons.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">Không có ưu đãi nào phù hợp với đơn hàng của bạn.</p>
              ) : (
                <>
                  <p className="font-semibold text-sm mb-2 text-foreground">Ưu đãi dành cho bạn ({sortedCoupons.length})</p>
                  {sortedCoupons.map((c: any) => {
                    const isSelected = appliedCoupon?.id === c.id;

                    return (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          if (!c.isApplicable) return;
                          setAppliedCoupon(c);
                          toast.success(`Đã áp dụng mã ${c.code}!`);
                          setIsCouponModalOpen(false);
                        }}
                        className={`relative grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center rounded-2xl border-2 p-3 transition sm:grid-cols-[4.5rem_minmax(0,1fr)_3rem] ${
                          !c.isApplicable
                            ? "border-transparent bg-secondary/50 opacity-50 grayscale cursor-not-allowed"
                            : isSelected 
                              ? "border-primary bg-primary/10 cursor-pointer shadow-xs" 
                              : "border-transparent bg-secondary hover:bg-secondary/80 hover:border-border cursor-pointer"
                        }`}
                      >
                        <div className="flex min-w-0 flex-col items-center justify-center text-primary sm:pr-2">
                          <span className="text-[10px] font-semibold uppercase leading-none text-muted-foreground">Giảm</span>
                          <span className="font-extrabold leading-none mt-1 text-base sm:text-lg text-primary">
                            {c.discountType === 'percent' ? `${Number(c.discountValue)}%` : (Number(c.discountValue) / 1000) + 'k'}
                          </span>
                        </div>
                        
                        <div className="min-w-0 border-l border-r border-dashed border-border/60 px-3">
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">{c.code}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{c.description || `Đơn tối thiểu ${formatPrice(Number(c.minOrderValue || 0))}`}</p>
                          {c.maxDiscount > 0 && <p className="text-[11px] text-muted-foreground">Tối đa {formatPrice(Number(c.maxDiscount))}</p>}
                        </div>

                        <div className="flex min-w-0 flex-col items-center justify-center pl-2 sm:pl-3">
                           <div className={`size-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"}`}>
                             {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="shrink-0 border-t bg-card p-3 sm:p-4">
               <button 
                onClick={() => {
                  setAppliedCoupon(null);
                  toast.success("Đã bỏ áp dụng mã giảm giá");
                  setIsCouponModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition text-sm cursor-pointer"
               >
                 Không dùng khuyến mãi
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
