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

  // Mock data for shipper and distance
  const [shipperPhone, setShipperPhone] = useState("");
  const [distance, setDistance] = useState("");
  
  useEffect(() => {
    // Generate random mock data once when component mounts
    setShipperPhone(`09${Math.floor(Math.random() * 90000000 + 10000000)}`);
    setDistance(`${(Math.random() * 5 + 0.5).toFixed(1)} km`);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    let intervalId: any;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${env.API_URL}/orders/public/${orderId}`, { headers });
        if (res.ok) {
          const data = await res.json();
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
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm border border-border/50 text-foreground">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SĐT Shipper (Cửa hàng)</p>
                    <p className="font-mono text-base font-semibold">{shipperPhone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm border border-border/50 text-foreground">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Khoảng cách đến bạn</p>
                    <p className="text-base font-semibold">{distance}</p>
                  </div>
                </div>
              
                <div className="mt-8 flex items-start gap-3 rounded-xl bg-card/80 border border-border/50 p-4 text-sm">
                  <MapPin size={20} className="mt-0.5 text-primary shrink-0" />
                  <p className="text-muted-foreground text-base">
                    <span className="font-medium text-foreground">Giao đến: </span> 
                    {order.shippingAddressStreet}, {order.shippingAddressWard}, {order.shippingAddressDistrict}, {order.shippingAddressProvince}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
