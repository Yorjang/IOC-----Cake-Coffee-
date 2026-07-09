import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Btn } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";

const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Cart({ cart, setCart, setView }: any) {
  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  const updateQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    const newCart = cart.filter((_: any, i: number) => i !== index);
    setCart(newCart);
    toast.error("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);
  const discount = Math.round(subtotal * (discountPercent / 100));
  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = subtotal - discount + shipping;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "COFFEE20") {
      setDiscountPercent(20);
      toast.success("Áp dụng mã giảm giá 20% thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

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
                placeholder="Mã giảm (COFFEE20)"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                className="flex-1 rounded-xl border bg-input px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <button onClick={applyCoupon} className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/80 transition">
                Áp dụng
              </button>
            </div>
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-600 font-medium"><span>Giảm giá (20%)</span><span>-{formatPrice(discount)}</span></div>
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
