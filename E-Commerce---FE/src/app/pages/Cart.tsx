import { useState } from "react";
import { Minus, Plus, Trash2, Ticket, X, ChevronRight, Check } from "lucide-react";
import { Btn } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";
import { matchSize } from "../App";

const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Cart({ cart, onUpdateQty, onRemoveItem, setView, publicCoupons = [], appliedCoupon, setAppliedCoupon, user }: any) {
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

  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

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

    if (subtotal < Number(found.minOrderValue || 0)) {
      toast.error(`Đơn hàng tối thiểu để áp dụng mã này là ${formatPrice(Number(found.minOrderValue))}.`);
      return;
    }

    if (found.productId) {
      const hasProduct = cart.some((item: any) => (item.productId || item.product?.raw?.id) === found.productId);
      if (!hasProduct) {
        toast.error("Mã này chỉ áp dụng cho sản phẩm nhất định.");
        return;
      }
    }

    if (found.categoriesId) {
      const hasCategory = cart.some((item: any) => {
        const prod = item.product?.raw;
        if (!prod) return false;
        return prod.categoryId === found.categoriesId || prod.categoriesId === found.categoriesId || prod.category?.id === found.categoriesId;
      });
      if (!hasCategory) {
        toast.error("Mã này chỉ áp dụng cho danh mục sản phẩm nhất định.");
        return;
      }
    }

    if (found.targetSize) {
      const hasSize = cart.some((item: any) => matchSize(item.size, found.targetSize));
      if (!hasSize) {
        toast.error(`Mã này chỉ áp dụng cho sản phẩm size ${found.targetSize}.`);
        return;
      }
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
    if (subtotal < Number(c.minOrderValue || 0)) isApplicable = false;
    if (isApplicable && c.productId) {
      const hasProduct = cart.some((item: any) => (item.productId || item.product?.raw?.id) === c.productId);
      if (!hasProduct) isApplicable = false;
    }
    if (isApplicable && c.categoriesId) {
      const hasCategory = cart.some((item: any) => {
        const prod = item.product?.raw;
        if (!prod) return false;
        return prod.categoryId === c.categoriesId || prod.categoriesId === c.categoriesId || prod.category?.id === c.categoriesId;
      });
      if (!hasCategory) isApplicable = false;
    }
    if (isApplicable && c.targetSize) {
      const hasSize = cart.some((item: any) => matchSize(item.size, c.targetSize));
      if (!hasSize) isApplicable = false;
    }
    return { ...c, isApplicable };
  }).sort((a: any, b: any) => {
    if (a.isApplicable && !b.isApplicable) return -1;
    if (!a.isApplicable && b.isApplicable) return 1;

    const getAmt = (c: any) => c.discountType === 'percent' ? (subtotal * Number(c.discountValue) / 100) : Number(c.discountValue);
    return getAmt(b) - getAmt(a);
  });

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
              className="flex items-center justify-between w-full rounded-xl border bg-input px-4 py-3 text-sm hover:border-primary transition"
            >
              <div className="flex items-center gap-3">
                <Ticket className="text-primary" size={20} />
                {appliedCoupon ? (
                  <div className="text-left">
                    <p className="font-bold text-foreground">Mã giảm giá <span className="text-primary font-mono">{appliedCoupon.code}</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Đã áp dụng thành công</p>
                  </div>
                ) : (
                  <span className="font-medium text-muted-foreground">Chọn hoặc nhập mã ưu đãi</span>
                )}
              </div>
              <ChevronRight className="text-muted-foreground" size={20} />
            </button>

            {bestCouponSuggestion && (!appliedCoupon || appliedCoupon.id !== bestCouponSuggestion.id) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span className="animate-bounce">💡</span>
                  {user ? (
                    <span>Gợi ý: Dùng mã <strong className="text-primary font-mono">{bestCouponSuggestion.code}</strong> để được giảm thêm <strong className="text-primary">{formatPrice(bestCouponDiscount)}</strong>!</span>
                  ) : (
                    <span>Gợi ý: Đăng nhập để dùng mã <strong className="text-primary font-mono">{bestCouponSuggestion.code}</strong> giảm thêm <strong className="text-primary">{formatPrice(bestCouponDiscount)}</strong>!</span>
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
                  className="w-full text-left text-primary font-bold hover:underline"
                >
                  {user ? "Áp dụng ngay" : "Đăng nhập ngay"}
                </button>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl px-3 py-2 text-xs">
                <span>Đã áp dụng: <strong>{appliedCoupon.code}</strong> (-{formatPrice(discount)})</span>
                <button type="button" onClick={() => setAppliedCoupon(null)} className="text-muted-foreground hover:text-red-500 font-bold ml-2">Gỡ</button>
              </div>
            )}

            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium"><span>Giảm giá</span><span>-{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between"><span>Phí giao hàng</span><span>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</span></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-bold text-lg">Khuyến mãi</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-secondary transition text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b bg-secondary/30 shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Nhập mã khuyến mãi..."
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    className="w-full rounded-xl border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary uppercase"
                  />
                </div>
                <button 
                  onClick={() => {
                    applyCoupon();
                    if (coupon.trim() && user && publicCoupons.some((c: any) => c.code.toUpperCase() === coupon.toUpperCase().trim())) {
                       setIsCouponModalOpen(false);
                    }
                  }} 
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/80 transition"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                        className={`relative flex items-center p-3 rounded-xl border-2 transition ${
                          !c.isApplicable
                            ? "border-transparent bg-secondary/50 opacity-50 grayscale cursor-not-allowed"
                            : isSelected 
                              ? "border-primary bg-primary/5 cursor-pointer" 
                              : "border-transparent bg-secondary hover:bg-secondary/80 hover:border-border cursor-pointer"
                        }`}
                      >
                        <div className="text-primary flex flex-col items-center justify-center shrink-0 w-[70px] mr-3">
                          <span className="text-[10px] font-semibold uppercase leading-none">Giảm</span>
                          <span className="font-bold leading-none mt-1 text-base">
                            {c.discountType === 'percent' ? `${Number(c.discountValue)}%` : (Number(c.discountValue) / 1000) + 'k'}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-4 border-r border-dashed border-border/60">
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">{c.code}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{c.description || `Đơn tối thiểu ${formatPrice(Number(c.minOrderValue || 0))}`}</p>
                          {c.maxDiscount > 0 && <p className="text-[11px] text-muted-foreground">Tối đa {formatPrice(Number(c.maxDiscount))}</p>}
                        </div>

                        <div className="pl-4 shrink-0 flex flex-col items-center gap-1 justify-center relative w-12">
                           <div className={`size-5 rounded-full border flex flex-col items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"}`}>
                             {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                           </div>
                           
                           {/* Cutout shapes */}
                           <div className="absolute -top-[1.3rem] -left-[1.3rem] size-3 rounded-full bg-card"></div>
                           <div className="absolute -bottom-[1.3rem] -left-[1.3rem] size-3 rounded-full bg-card"></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-4 border-t bg-card shrink-0">
               <button 
                onClick={() => {
                  setAppliedCoupon(null);
                  toast.success("Đã bỏ áp dụng mã giảm giá");
                  setIsCouponModalOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition"
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
