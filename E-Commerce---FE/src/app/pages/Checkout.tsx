import { useState } from "react";
import { Truck, CreditCard, PackageCheck } from "lucide-react";
import { Btn } from "../components/shared";
import { CHECKOUT_CONFIG, VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Checkout({ cart, setView, onPlaceOrder, subtotal, discount, shipping, grandTotal }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Thanh toán khi nhận hàng (COD)");

  const handleCheckout = (e: any) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }
    onPlaceOrder();
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl font-bold font-serif">Thanh toán</h2>
      <form onSubmit={handleCheckout} className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2 text-base"><Truck size={18} /> Thông tin giao hàng</h3>
            <input required type="text" placeholder="Họ tên người nhận" value={name} onChange={e => setName(e.target.value)} className="mb-3 w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm" />
            <input required type="tel" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className="mb-3 w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm" />
            <textarea required placeholder="Địa chỉ chi tiết" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm"></textarea>
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2 text-base"><CreditCard size={18} /> Phương thức thanh toán</h3>
            <div className="space-y-2">
              {CHECKOUT_CONFIG.PAYMENT_METHODS.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${paymentMethod === m ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="accent-primary" />
                  <span className="text-sm">{m}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <div>
          <div className="rounded-2xl border bg-card p-6 sticky top-20">
            <h3 className="mb-4 font-semibold text-lg font-serif">Chi tiết đơn hàng</h3>
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-1">
              {cart.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{item.product[0]} (x{item.quantity})</span>
                  <span className="text-muted-foreground shrink-0">{item.product[1]}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3 mb-6 text-sm">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between"><span>Phí giao hàng</span><span>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</span></div>
              <hr className="my-2 border-border" />
              <div className="flex justify-between font-bold text-lg"><span>Tổng cộng</span><span className="text-primary">{formatPrice(grandTotal)}</span></div>
            </div>
            <Btn type="submit" className="w-full">Xác nhận đặt hàng</Btn>
          </div>
        </div>
      </form>
    </div>
  );
}

export function Success({ setView }: any) {
  const [orderId] = useState(() => "SB" + Math.floor(100000 + Math.random() * 900000));
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-6 grid size-20 place-items-center rounded-full bg-green-100 text-green-600">
        <PackageCheck size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-bold font-serif">Đặt hàng thành công!</h2>
      <p className="mb-8 text-muted-foreground text-sm">Mã đơn hàng của bạn là <strong className="text-primary">#{orderId}</strong>. Chúng tôi sẽ sớm giao hàng đến bạn.</p>
      <Btn onClick={() => setView(VIEW_KEYS.HOME)}>Về trang chủ</Btn>
    </div>
  );
}
