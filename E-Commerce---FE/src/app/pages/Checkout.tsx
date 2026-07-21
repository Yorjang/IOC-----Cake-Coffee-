import { useState, useEffect } from "react";
import { Truck, CreditCard, Store, MapPin, ShieldAlert, Clock, Crosshair, CheckCircle2, Loader2 } from "lucide-react";
import { Btn } from "../components/shared";
import { CHECKOUT_CONFIG } from "../../config/appConfig";
import { useCheckout } from "../features/checkout/hooks/useCheckout";
const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Checkout(props: any) {
  const {
    fulfillmentType, setFulfillmentType,
    name, setName,
    phone, setPhone,
    address, setAddress,
    selectedBranchId, setSelectedBranchId,
    note, setNote,
    paymentMethodText, setPaymentMethodText,
    branches,
    loadingBranches,
    hasCustomerLocation,
    checkoutError, setCheckoutError,
    handleCheckout
  } = useCheckout(props);

  const { cart, subtotal, discount, shipping, grandTotal } = props;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl font-bold font-serif">Thanh toán</h2>
      <form onSubmit={handleCheckout} className="grid gap-8 md:grid-cols-2 w-full">
        {checkoutError && (
          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} />
              <span>{checkoutError}</span>
            </div>
            <button type="button" onClick={() => setCheckoutError(null)} className="text-red-600 dark:text-red-400 font-bold hover:opacity-85">✕</button>
          </div>
        )}
        <div className="space-y-6">
          {/* Fulfillment Type Selection */}
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2 text-base"><Store size={18} /> Hình thức nhận hàng</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType("delivery")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${fulfillmentType === "delivery" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Truck size={20} />
                <span className="text-sm font-semibold">Giao hàng tận nơi</span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType("pickup")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${fulfillmentType === "pickup" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted text-muted-foreground"
                  }`}
              >
                <Store size={20} />
                <span className="text-sm font-semibold">Nhận tại cửa hàng</span>
              </button>
            </div>
          </section>

          {/* Recipient Details */}
          <section className="rounded-2xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-base">
              {fulfillmentType === "delivery" ? <Truck size={18} /> : <Store size={18} />}
              Thông tin người nhận
            </h3>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Họ và tên</label>
              <input required type="text" placeholder="Họ tên người nhận" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Số điện thoại</label>
              <input required type="tel" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm" />
            </div>

            {fulfillmentType === "delivery" ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Địa chỉ giao hàng</label>
                <textarea required placeholder="Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã, Quận/Huyện...)" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm"></textarea>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-foreground">Chọn chi nhánh nhận hàng</label>
                    <p className="mt-1 text-xs text-muted-foreground">Chỉ hiển thị cửa hàng đang mở và có thể tiếp nhận đơn.</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasCustomerLocation ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {hasCustomerLocation ? <Crosshair size={12} /> : <MapPin size={12} />}
                    {hasCustomerLocation ? "Gần bạn nhất" : "Chưa có vị trí"}
                  </span>
                </div>
                {loadingBranches ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 py-8 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin" size={18} /> Đang tìm cửa hàng đang mở gần bạn...
                  </div>
                ) : branches.length > 0 ? (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {branches.map((branch, index) => {
                      const selected = selectedBranchId === branch.id;
                      const openingTime = branch.todayOpeningHour?.openingTime?.slice(0, 5);
                      const closingTime = branch.todayOpeningHour?.closingTime?.slice(0, 5);
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => setSelectedBranchId(branch.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-primary bg-primary/5 shadow-sm" : "bg-card hover:border-primary/50 hover:bg-muted/30"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              <Store size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{branch.name}</p>
                                  {index === 0 && hasCustomerLocation && <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">Gần nhất đang mở</span>}
                                </div>
                                {selected && <CheckCircle2 className="shrink-0 text-primary" size={18} />}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{branch.address}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700"><span className="size-1.5 rounded-full bg-green-500" />Đang mở</span>
                                {openingTime && closingTime && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground"><Clock size={11} />{openingTime}–{closingTime}</span>}
                                {typeof branch.distanceKm === "number" && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-primary"><MapPin size={11} />{branch.distanceKm.toFixed(1)} km</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                    Hiện chưa có chi nhánh nào đang mở cửa. Vui lòng quay lại trong giờ phục vụ.
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Ghi chú đơn hàng (Tùy chọn)</label>
              <input type="text" placeholder="VD: Giao giờ hành chính, ít ngọt..." value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary text-sm" />
            </div>
          </section>

          {/* Payment Methods */}
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2 text-base"><CreditCard size={18} /> Phương thức thanh toán</h3>
            <div className="space-y-2">
              {CHECKOUT_CONFIG.PAYMENT_METHODS.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${paymentMethodText === m ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <input type="radio" name="payment" checked={paymentMethodText === m} onChange={() => setPaymentMethodText(m)} className="accent-primary" />
                  <span className="text-sm">{m}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Order Details Column */}
        <div>
          <div className="rounded-2xl border bg-card p-6 sticky top-20 shadow-sm">
            <h3 className="mb-4 font-semibold text-lg font-serif">Chi tiết đơn hàng</h3>
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-1">
              {cart.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{item.product[0]} ({item.size}) (x{item.quantity})</span>
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
            <Btn type="submit" className="w-full py-3 text-sm">Xác nhận đặt hàng</Btn>
          </div>
        </div>
      </form>
    </div>
  );
}

