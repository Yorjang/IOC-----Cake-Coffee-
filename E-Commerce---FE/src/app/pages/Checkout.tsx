import { parseRes } from '../../utils/api';
import { useState, useEffect } from "react";
import { Truck, CreditCard, PackageCheck, Store, MapPin, ClipboardList, Copy, Check, Loader2, ShieldAlert, Clock, Crosshair, CheckCircle2 } from "lucide-react";
import { Btn } from "../components/shared";
import { CHECKOUT_CONFIG, VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";
import { env } from "../../config/env";
import { getAccessToken } from "../components/authSession";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Checkout({ cart, setView, onPlaceOrder, subtotal, discount, shipping, grandTotal, user }: any) {
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState(user?.fullName || user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethodText, setPaymentMethodText] = useState("Thanh toán khi nhận hàng (COD)");

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [hasCustomerLocation, setHasCustomerLocation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  console.log("cart", cart);

  console.log("cart111", cart.length !== 0);

  // useEffect(() => {
  //   if (!cart || cart.length === 0) {
  //     toast.error("Giỏ hàng trống! Không thể thực hiện thanh toán.");
  //     setView(VIEW_KEYS.HOME);
  //   }
  // }, [cart, setView]);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        let endpoint = `${env.API_URL}/branches/active`;
        if ("geolocation" in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 7000,
                maximumAge: 300000,
              }),
            );
            endpoint = `${env.API_URL}/branches/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
            setHasCustomerLocation(true);
          } catch {
            setHasCustomerLocation(false);
          }
        }

        let res = await fetch(endpoint);
        if (!res.ok && endpoint.includes("/nearby")) {
          setHasCustomerLocation(false);
          res = await fetch(`${env.API_URL}/branches/active`);
        }
        if (!res.ok) throw new Error("Không thể tải danh sách chi nhánh");

        const data = await parseRes(res);
        const openBranches = (Array.isArray(data) ? data : [data]).filter(branch => branch.isOpenNow);
        setBranches(openBranches);
        setSelectedBranchId(openBranches[0]?.id || "");
      } catch (err) {
        console.error("Error fetching branches:", err);
        setBranches([]);
        setSelectedBranchId("");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const handleCheckout = async (e: any) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!name.trim() || !phone.trim()) {
      const err = "Vui lòng điền họ tên và số điện thoại người nhận!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    if (fulfillmentType === "delivery" && !address.trim()) {
      const err = "Vui lòng nhập địa chỉ giao hàng!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    if (!selectedBranchId) {
      const err = "Hiện không có chi nhánh đang mở để tiếp nhận đơn hàng!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    // Map payment method text to DB enum
    let paymentMethod = "cod";
    if (paymentMethodText === "Chuyển khoản ngân hàng") {
      paymentMethod = "bank_transfer";
    } else if (paymentMethodText === "Ví Momo") {
      paymentMethod = "momo";
    }

    const finalBranchId = selectedBranchId;

    try {
      await onPlaceOrder({
        branchId: finalBranchId,
        fulfillmentType,
        shippingRecipientName: name,
        shippingAddressPhone: phone,
        shippingAddressStreet: fulfillmentType === "delivery" ? address : "",
        paymentMethod,
        note
      });
    } catch (err: any) {
      setCheckoutError(err.message || "Lỗi khi gửi đơn hàng lên máy chủ.");
    }
  };

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

export function Success({ setView, order }: any) {
  const [qrData, setQrData] = useState<any>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const orderId = order?.id;
  const orderCode = order?.orderCode || "SB9999";
  const isBankTransfer = order?.paymentMethod === 'bank_transfer';

  // 1. Fetch QR Details
  useEffect(() => {
    if (!isBankTransfer || !orderId) return;



    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    setLoadingQr(true);
    fetch(`${env.API_URL}/payments/qr/${orderId}`, {
      headers
    })
      .then(res => res.json())
      .then(data => {
        setQrData(data);
        setLoadingQr(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingQr(false);
      });
  }, [orderId, isBankTransfer]);

  // 2. Poll Order paymentStatus
  useEffect(() => {
    if (!isBankTransfer || !orderId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${env.API_URL}/orders/public/${orderId}`);
        if (res.ok) {
          const currentOrder = await parseRes(res);
          if (currentOrder && currentOrder.paymentStatus === 'paid') {
            setIsPaid(true);
            toast.success("Thanh toán thành công qua SePay!");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, isBankTransfer, isPaid]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isBankTransfer) {
    return (
      <div className="mx-auto max-w-lg py-12 px-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl text-center">
          <div className="mb-4 mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList size={28} />
          </div>
          <h2 className="mb-2 text-2xl font-bold font-serif">Thanh toán đơn hàng</h2>
          <p className="mb-6 text-muted-foreground text-sm">
            Vui lòng quét mã QR bên dưới hoặc chuyển khoản chính xác nội dung để xác nhận đơn hàng tự động.
          </p>

          {loadingQr || !qrData ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* VietQR Image */}
              <div className="relative mx-auto size-64 overflow-hidden rounded-xl border-2 border-primary/20 bg-white p-2 shadow-md">
                <img src={qrData.qrUrl} alt="VietQR Payment" className="size-full object-contain" />
              </div>

              {/* Status Box */}
              {isPaid ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-green-200/50 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-green-600 dark:text-green-400 text-sm font-semibold">
                  <div className="size-2 rounded-full bg-green-500 animate-ping" />
                  <Check size={18} />
                  <span>Đã nhận thanh toán! Đang xác nhận đơn hàng...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-amber-600 dark:text-amber-400 text-sm font-semibold">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Đang chờ chuyển khoản tự động qua SePay...</span>
                </div>
              )}

              {/* Transfer Details */}
              <div className="divide-y divide-border rounded-xl border border-border bg-muted/30 text-left text-sm overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground">Ngân hàng</span>
                  <span className="font-semibold">{qrData.bankId}</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{qrData.bankAccount}</span>
                    <button
                      onClick={() => handleCopy(qrData.bankAccount, 'account')}
                      className="text-primary hover:text-primary/80"
                    >
                      {copiedField === 'account' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground">Tên tài khoản</span>
                  <span className="font-semibold">{qrData.bankAccountName}</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground">Số tiền</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatPrice(Number(qrData.totalAmount))}</span>
                    <button
                      onClick={() => handleCopy(String(qrData.totalAmount), 'amount')}
                      className="text-primary hover:text-primary/80"
                    >
                      {copiedField === 'amount' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground">Nội dung chuyển khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary uppercase">{qrData.paymentContent}</span>
                    <button
                      onClick={() => handleCopy(qrData.paymentContent, 'content')}
                      className="text-primary hover:text-primary/80"
                    >
                      {copiedField === 'content' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-4">
            {getAccessToken() && (
              <Btn variant="outline" onClick={() => setView(VIEW_KEYS.PROFILE)}>
                Xem đơn hàng
              </Btn>
            )}
            <Btn onClick={() => setView("Theo dõi", orderId)}>Theo dõi đơn</Btn>
            <Btn onClick={() => setView(VIEW_KEYS.HOME)}>
              Về trang chủ
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-6 grid size-20 place-items-center rounded-full bg-green-100 text-green-600">
        <PackageCheck size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-bold font-serif">Đặt hàng thành công!</h2>
      <p className="mb-8 text-muted-foreground text-sm">
        Mã đơn hàng của bạn là <strong className="text-primary">#{orderCode}</strong>. Chúng tôi sẽ sớm giao hàng đến bạn.
      </p>
      <div className="flex gap-4">
        {getAccessToken() && (
          <Btn variant="outline" onClick={() => setView(VIEW_KEYS.PROFILE)}>
            Xem đơn hàng
          </Btn>
        )}
        <Btn onClick={() => setView("Theo dõi", order?.id)}>Theo dõi đơn</Btn>
        <Btn onClick={() => setView(VIEW_KEYS.HOME)}>Về trang chủ</Btn>
      </div>
    </div>
  );
}
