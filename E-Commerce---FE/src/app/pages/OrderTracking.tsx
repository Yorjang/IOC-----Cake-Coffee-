import { ArrowLeft, Clock, CreditCard, Loader2, MapPin, Package, Phone, Store, Truck, Check, Star } from 'lucide-react';
import { useOrderTracking } from '../features/order-tracking/hooks/useOrderTracking';
import { OrderTimeline } from '../features/order-tracking/ui/OrderTimeline';
import { OrderList } from '../features/order-tracking/ui/OrderList';
import { useEffect, useState } from 'react';
import { CreateReviewModal } from '../features/reviews/ui/CreateReviewModal';


interface OrderTrackingProps {
  orderId?: string | null;
  onBack: () => void;
}

const money = (value: number | string) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const paymentLabels: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng',
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  zalopay: 'ZaloPay',
};
const paymentStatusLabels: Record<string, string> = {
  pending: 'Chưa thanh toán', paid: 'Đã thanh toán', failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền', refund_pending: 'Đang hoàn tiền',
};

export function OrderTracking({ orderId, onBack }: OrderTrackingProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orderId ?? null);
  useEffect(() => setSelectedOrderId(orderId ?? null), [orderId]);

  if (selectedOrderId) {
    return <OrderTrackingDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
  }

  return <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-8">
    <div className="mb-8 grid grid-cols-[40px_1fr_40px] items-center">
      <button onClick={onBack} aria-label="Quay lại" className="flex size-10 items-center justify-center rounded-full bg-muted hover:bg-muted/70"><ArrowLeft size={20} /></button>
      <div className="text-center"><h1 className="font-serif text-2xl font-bold">Đơn hàng của bạn</h1><p className="mt-1 text-sm text-muted-foreground">Chọn một đơn để theo dõi chi tiết</p></div>
    </div>
    <OrderList onSelect={setSelectedOrderId} />
  </div>;
}

function OrderTrackingDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { order, loading, cancelOrder, refetch } = useOrderTracking(orderId);
  const [selectedReviewItem, setSelectedReviewItem] = useState<{
    orderId: string;
    productId: string;
    productName: string;
    variantName?: string;
    productImage?: string;
  } | null>(null);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={44} /></div>;
  if (!order) return <div className="mx-auto max-w-lg p-10 text-center"><p className="text-muted-foreground">Không tìm thấy đơn hàng.</p><button onClick={onBack} className="mt-5 rounded-xl bg-primary px-6 py-2 font-semibold text-primary-foreground">Quay lại</button></div>;

  const isPickup = order.fulfillmentType === 'pickup';
  const address = [order.shippingAddressStreet, order.shippingAddressWard, order.shippingAddressDistrict, order.shippingAddressProvince].filter(Boolean).join(', ');
  const statusText = order.orderStatus === 'completed'
    ? (isPickup ? 'Đơn đã được nhận tại chi nhánh' : 'Đã giao hàng thành công')
    : order.orderStatus === 'cancelled' ? 'Đơn hàng đã bị hủy'
    : isPickup ? 'Vui lòng theo dõi để đến nhận đúng lúc' : 'Đơn hàng đang được xử lý';

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8">
      <div className="mb-8 grid grid-cols-[40px_1fr_40px] items-center">
        <button onClick={onBack} aria-label="Quay lại" className="flex size-10 items-center justify-center rounded-full bg-muted hover:bg-muted/70"><ArrowLeft size={20} /></button>
        <div className="text-center"><h1 className="font-serif text-2xl font-bold">Theo dõi đơn hàng</h1><p className="mt-1 text-sm text-muted-foreground">Mã đơn: <span className="font-mono font-semibold">#{order.orderCode}</span> · {isPickup ? 'Nhận tại cửa hàng' : 'Giao tận nơi'}</p></div>
      </div>

      <OrderTimeline fulfillmentType={order.fulfillmentType} status={order.orderStatus} />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-full bg-orange-100 p-2 text-orange-600"><Package size={20} /></div><div><h2 className="font-semibold">Chi tiết sản phẩm</h2><p className="text-sm text-muted-foreground">{order.items.length} sản phẩm trong đơn</p></div></div>
          <div className="divide-y divide-border">
            {order.items?.map((item: any) => <div key={item.id} className="border-b border-border/50 py-4 last:border-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{item.quantity} × {item.productName}</p>
                  {item.variantName && <p className="mt-1 text-sm text-muted-foreground">Phân loại: {item.variantName}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">Đơn giá: {money(item.unitPrice)}</p>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2">
                  <p className="shrink-0 font-semibold">{money(item.totalPrice)}</p>
                  {order.orderStatus === 'completed' && (
                    (item as any).isReviewed ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check size={12} /> Đã đánh giá
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReviewItem({
                            orderId: order.id,
                            productId: item.productId,
                            productName: item.productName,
                            variantName: item.variantName,
                            productImage: (item as any).productImage,
                          })
                        }
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/90 hover:bg-amber-200 dark:hover:bg-amber-900 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1 transition-transform hover:scale-105 shadow-2xs"
                      >
                        <span>⭐ Đánh giá nhận voucher</span>
                      </button>
                    )
                  )}
                </div>
              </div>
              {item.review && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-sm">
                  <div className="flex items-center gap-1 mb-2 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < item.review.rating ? "fill-current" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  {item.review.comment && (
                    <p className="text-foreground/90 italic">"{item.review.comment}"</p>
                  )}
                  {item.review.imageUrl && (
                    <img src={item.review.imageUrl} alt="Review" className="mt-3 w-24 h-24 object-cover rounded-xl border border-border shadow-sm" />
                  )}
                </div>
              )}
            </div>)}
          </div>
          {order.note && <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm"><span className="font-medium">Ghi chú:</span> {order.note}</div>}
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-semibold text-primary">{isPickup ? <Store size={20} /> : <Truck size={20} />}{isPickup ? 'Thông tin nhận tại chi nhánh' : 'Thông tin giao hàng'}</h2>
            {isPickup ? <div className="space-y-4"><Info icon={<Store size={18} />} label="Chi nhánh" value={order.branch?.name || 'Đang cập nhật'} /><Info icon={<MapPin size={18} />} label="Địa chỉ nhận hàng" value={order.branch?.address || 'Đang cập nhật'} />{order.branch?.phone && <Info icon={<Phone size={18} />} label="Điện thoại chi nhánh" value={order.branch.phone} />}{order.pickupAt && <Info icon={<Clock size={18} />} label="Thời gian nhận dự kiến" value={new Date(order.pickupAt).toLocaleString('vi-VN')} />}</div>
              : <div className="space-y-4"><Info icon={<MapPin size={18} />} label="Giao đến" value={address || 'Địa chỉ đang được cập nhật'} />{order.shippingRecipientName && <Info icon={<Package size={18} />} label="Người nhận" value={order.shippingRecipientName} />}{order.shippingAddressPhone && <Info icon={<Phone size={18} />} label="Số điện thoại" value={order.shippingAddressPhone} />}{order.deliveryAt && <Info icon={<Clock size={18} />} label="Thời gian giao dự kiến" value={new Date(order.deliveryAt).toLocaleString('vi-VN')} />}</div>}
            <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm font-medium text-primary">{statusText}</div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-semibold"><CreditCard size={20} /> Thanh toán</h2>
            <PriceRow label="Tạm tính" value={money(order.subtotal)} /><PriceRow label="Giảm giá" value={`-${money(order.discountAmount)}`} highlight /><PriceRow label="Phí giao hàng" value={isPickup ? 'Miễn phí' : money(order.shippingFee)} />
            <div className="my-4 border-t border-border" />
            <PriceRow label="Tổng cộng" value={money(order.totalAmount)} total />
            <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm"><p>{paymentLabels[order.paymentMethod] || order.paymentMethod}</p><p className="mt-1 font-medium text-primary">{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}</p></div>
          </section>
        </div>
      </div>

      {order.orderStatus === 'pending' && <div className="mt-6 flex justify-end"><button onClick={() => window.confirm('Bạn có chắc muốn hủy đơn hàng này?') && void cancelOrder()} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">Hủy đơn hàng</button></div>}

      {/* Review Modal */}
      {selectedReviewItem && (
        <CreateReviewModal
          isOpen={!!selectedReviewItem}
          onClose={() => setSelectedReviewItem(null)}
          orderId={selectedReviewItem.orderId}
          productId={selectedReviewItem.productId}
          productName={selectedReviewItem.productName}
          variantName={selectedReviewItem.variantName}
          productImage={selectedReviewItem.productImage}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

interface InfoProps { icon: React.ReactNode; label: string; value: string; }
function Info({ icon, label, value }: InfoProps) {
  return <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium leading-relaxed">{value}</p></div></div>;
}

interface PriceRowProps { label: string; value: string; highlight?: boolean; total?: boolean; }
function PriceRow({ label, value, highlight, total }: PriceRowProps) {
  return <div className={`flex justify-between py-1.5 ${total ? 'text-lg font-bold' : 'text-sm'} ${highlight ? 'text-green-600' : ''}`}><span>{label}</span><span>{value}</span></div>;
}
