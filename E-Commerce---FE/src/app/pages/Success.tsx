import { useState, useEffect } from "react";
import { ClipboardList, Check, Loader2, Copy, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { parseRes } from "../../utils/api";
import { env } from "../../config/env";
import { getAccessToken } from "../components/authSession";
import { Btn } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";
import { VnpayPayment } from "../features/checkout/ui/VnpayPayment";

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Success({ setView, order, orderId: orderIdProp }: any) {
  const [qrData, setQrData] = useState<any>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);

  // Dùng order từ prop nếu có, nếu không thì fetch theo orderId
  const resolvedOrder = order || fetchedOrder;
  const orderId = resolvedOrder?.id || orderIdProp;

  useEffect(() => {
    if (!order && orderIdProp) {
      // Fetch order từ orderId khi vào từ Profile/Banner
      fetch(`${env.API_URL}/orders/public/${orderIdProp}`)
        .then(parseRes)
        .then(data => setFetchedOrder(data))
        .catch(console.error);
    }
  }, [order, orderIdProp]);

  // Bỏ tự động redirect sang HOME để tránh lỗi chớp tắt state khi React chưa cập nhật kịp order

  if (!resolvedOrder && !orderIdProp) return null;

  const orderCode = resolvedOrder?.orderCode || "...";
  const isBankTransfer = resolvedOrder?.paymentMethod === 'bank_transfer';
  const isVnpay = resolvedOrder?.paymentMethod === 'vnpay';

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
      .then(parseRes)
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

  if (isVnpay && orderId) {
    return <VnpayPayment orderId={orderId} orderCode={orderCode} setView={setView} />;
  }

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
                    <span className="font-mono font-semibold text-primary uppercase">{qrData.transferContent}</span>
                    <button
                      onClick={() => handleCopy(qrData.transferContent, 'content')}
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

