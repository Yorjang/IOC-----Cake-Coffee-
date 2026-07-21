import { parseRes } from '../../utils/api';
import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Phone, MapPin, Package, Clock, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { env } from "../../config/env";

interface OrderTrackingProps {
  orderId: string;
  onBack: () => void;
}

const STEPS = [
  { key: "pending", label: "Xác nhận đơn hàng" },
  { key: "confirmed", label: "Đã lấy đơn" },
  { key: "shipping", label: "Đang vận chuyển" },
  { key: "completed", label: "Hoàn Thành" },
];

export function OrderTracking({ orderId, onBack }: OrderTrackingProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInfo, setRefundInfo] = useState({ bankName: "", accountNumber: "", accountName: "" });



  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let intervalId: any;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${env.API_URL}/orders/public/${orderId}`, { headers });
        if (res.ok) {
          const data = await parseRes(res);
          setOrder(data);
        } else {
          toast.error("Không thể tải thông tin đơn hàng");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    intervalId = setInterval(fetchOrder, 10000); // Tự động cập nhật mỗi 10 giây

    return () => clearInterval(intervalId);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (order.paymentStatus === 'paid') {
      setShowRefundModal(true);
      return;
    }
    await processCancellation();
  };

  const processCancellation = async (refundData?: any) => {
    if (!refundData && !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const sessionId = localStorage.getItem("sb_cart_session_id");
      if (sessionId) headers["x-session-id"] = sessionId;

      const body: any = {};
      if (refundData) body.refundInfo = refundData;

      const res = await fetch(`${env.API_URL}/orders/public/${orderId}/cancel`, {
        method: "PATCH",
        headers,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        toast.success("Đã hủy đơn hàng thành công");
        setOrder({ ...order, orderStatus: "cancelled", paymentStatus: refundData ? "refund_pending" : order.paymentStatus });
        setShowRefundModal(false);
      } else {
        const data = await res.json();
        toast.error(data.message || "Không thể hủy đơn hàng");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi hủy đơn hàng");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-muted-foreground">Không tìm thấy đơn hàng.</p>
        <button onClick={onBack} className="mt-4 rounded-xl bg-primary px-6 py-2 text-primary-foreground font-semibold">
          Quay lại
        </button>
      </div>
    );
  }

  // Determine current step index based on order status
  let currentStepIndex = 0;
  if (order.orderStatus === 'confirmed' || order.orderStatus === 'preparing') {
    currentStepIndex = 1;
  } else if (order.orderStatus === 'shipping') {
    currentStepIndex = 2;
  } else if (order.orderStatus === 'completed') {
    currentStepIndex = 3;
  } else if (order.orderStatus === 'cancelled') {
    currentStepIndex = -1;
  }

  const getEstimatedTime = () => {
    if (order.orderStatus === 'completed') return "Đã giao thành công";
    if (order.orderStatus === 'cancelled') return "Đơn hàng đã hủy";
    return "Dự kiến giao trong 15-20 phút nữa";
  };

  const getStatusText = () => {
    const map: Record<string, string> = {
      'pending': 'Đang chờ cửa hàng xác nhận',
      'confirmed': 'Cửa hàng đã xác nhận và đang chuẩn bị món',
      'preparing': 'Đang chuẩn bị món',
      'shipping': 'Shipper đang trên đường giao đến bạn',
      'completed': 'Đơn hàng đã hoàn thành',
      'cancelled': 'Đơn hàng đã bị hủy'
    };
    return map[order.orderStatus] || 'Đang xử lý';
  };

  // Extract items for display
  const itemsText = order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(", ") || "Chưa có thông tin bánh";

  return (
    <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold font-serif">Theo dõi đơn hàng</h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">Mã đơn: #{order.orderCode}</p>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Top Section: Full-width Stepper */}
        <div className="w-full">
          {order.orderStatus === 'cancelled' ? (
            <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 flex flex-col items-center justify-center text-red-500">
              <Package size={48} className="mb-4 opacity-50" />
              <h2 className="text-2xl font-bold">Đơn hàng đã bị hủy</h2>
              <p className="mt-2 text-red-600/70 text-center">Rất tiếc vì sự cố này. Bạn có thể đặt món lại trên trang chủ.</p>
              {order.paymentStatus === 'refund_pending' && (
                <div className="mt-6 w-full max-w-sm rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/20">
                  <p className="font-semibold flex items-center justify-center gap-2"><Clock size={18} /> Đang chờ hoàn tiền</p>
                  <p className="text-sm mt-2 text-center opacity-90">Yêu cầu hoàn tiền của bạn đang được xử lý. Tiền sẽ về tài khoản trong 1-2 ngày làm việc.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-x-auto">
              <div className="relative flex items-start justify-between min-w-[700px] px-8 py-2">
              {/* Connecting Line */}
              <div className="absolute left-[80px] right-[80px] top-[32px] -translate-y-1/2 h-1 bg-muted/60 rounded-full z-0"></div>
              
              {/* Active Connecting Line */}
              <div 
                className="absolute left-[80px] top-[32px] -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-500 ease-in-out"
                style={{ width: currentStepIndex > 0 ? `calc((100% - 160px) * ${currentStepIndex / (STEPS.length - 1)})` : '0px' }}
              ></div>

              {/* Steps */}
              {STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-3 w-24">
                    <div 
                      className={`flex size-12 items-center justify-center rounded-full border-4 shadow-sm transition-colors duration-500
                        ${isActive 
                          ? 'border-green-100 bg-green-500 text-white dark:border-green-950' 
                          : 'border-muted bg-card text-muted-foreground'
                        }`
                      }
                    >
                      {isActive ? <Check size={20} strokeWidth={3} /> : <div className="size-3 rounded-full bg-muted-foreground/30"></div>}
                    </div>
                    <span className={`text-sm font-medium text-center ${isCurrent ? 'text-foreground font-bold' : isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Bottom Section: Order Details & Shipping Info */}
        <div className="grid gap-8 lg:grid-cols-2 items-start w-full">
          {/* Left Card: Order Items & Status */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-md h-full">
            <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 h-full flex flex-col justify-center">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Món ăn của bạn</p>
                    <p className="text-base font-semibold text-foreground">{itemsText}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Trạng thái / Thời gian dự kiến</p>
                    <p className="text-base font-semibold text-foreground">{getStatusText()}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 font-medium">{getEstimatedTime()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Shipper Details */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-md h-full">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 h-full">
              <h3 className="mb-6 text-base font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <Package size={20} /> Thông tin giao hàng
              </h3>
              <div className="space-y-6">

              
                <div className="mt-8 flex items-start gap-3 rounded-xl bg-card/80 border border-border/50 p-4 text-sm">
                  <MapPin size={20} className="mt-0.5 text-primary shrink-0" />
                  <p className="text-muted-foreground text-base">
                    <span className="font-medium text-foreground">Giao đến: </span> 
                    {order.shippingAddressStreet}, {order.shippingAddressWard}, {order.shippingAddressDistrict}, {order.shippingAddressProvince}
                  </p>
                </div>

                {order.orderStatus === 'pending' && (
                  <div className="pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-900/40"
                    >
                      Hủy đơn hàng
                    </button>
                    <p className="text-center text-xs text-muted-foreground mt-2">Chỉ có thể hủy khi đơn hàng chưa được xác nhận/thanh toán</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-xl font-bold text-foreground">Yêu cầu hoàn tiền</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Đơn hàng của bạn đã được thanh toán. Vui lòng cung cấp thông tin tài khoản ngân hàng để chúng tôi tiến hành hoàn tiền.
            </p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Ngân hàng thụ hưởng</label>
                <input 
                  type="text" 
                  value={refundInfo.bankName}
                  onChange={(e) => setRefundInfo({...refundInfo, bankName: e.target.value})}
                  placeholder="VD: Vietcombank, Techcombank..." 
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Số tài khoản</label>
                <input 
                  type="text" 
                  value={refundInfo.accountNumber}
                  onChange={(e) => setRefundInfo({...refundInfo, accountNumber: e.target.value})}
                  placeholder="Nhập số tài khoản" 
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tên chủ tài khoản</label>
                <input 
                  type="text" 
                  value={refundInfo.accountName}
                  onChange={(e) => setRefundInfo({...refundInfo, accountName: e.target.value})}
                  placeholder="NGUYEN VAN A" 
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowRefundModal(false)}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  if (!refundInfo.bankName || !refundInfo.accountNumber || !refundInfo.accountName) {
                    toast.error("Vui lòng điền đầy đủ thông tin");
                    return;
                  }
                  processCancellation(refundInfo);
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xác nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
