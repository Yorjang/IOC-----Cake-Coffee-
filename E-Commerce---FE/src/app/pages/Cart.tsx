import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Btn } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";

const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Cart({ cart, onUpdateQty, onRemoveItem, setView, publicCoupons = [], appliedCoupon, setAppliedCoupon, user }: any) {
  const [coupon, setCoupon] = useState("");

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
    if (appliedCoupon.productId) {
      const matchingItems = cart.filter((item: any) => (item.productId || item.product?.raw?.id) === appliedCoupon.productId);
      const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(matchingSubtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(matchingSubtotal, Number(appliedCoupon.discountValue));
      }
    } else {
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(subtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(subtotal, Number(appliedCoupon.discountValue));
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
      toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
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

      let currentDiscount = 0;
      if (c.productId) {
        const matchingItems = cart.filter((item: any) => (item.productId || item.product?.raw?.id) === c.productId);
        if (matchingItems.length === 0) return;
        const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);
        if (c.discountType === "percent") {
          currentDiscount = Math.round(matchingSubtotal * (Number(c.discountValue) / 100));
          if (c.maxDiscount && Number(c.maxDiscount) > 0) {
            currentDiscount = Math.min(currentDiscount, Number(c.maxDiscount));
          }
        } else {
          currentDiscount = Math.min(matchingSubtotal, Number(c.discountValue));
        }
      } else {
        if (c.discountType === "percent") {
          currentDiscount = Math.round(subtotal * (Number(c.discountValue) / 100));
          if (c.maxDiscount && Number(c.maxDiscount) > 0) {
            currentDiscount = Math.min(currentDiscount, Number(c.maxDiscount));
          }
        } else {
          currentDiscount = Math.min(subtotal, Number(c.discountValue));
        }
      }

      if (currentDiscount > bestCouponDiscount) {
        bestCouponDiscount = currentDiscount;
        bestCouponSuggestion = c;
      }
    });
  }

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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã giảm giá..."
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                className="flex-1 rounded-xl border bg-input px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <button onClick={applyCoupon} className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/80 transition">
                Áp dụng
              </button>
            </div>

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
    </div>
  );
}
