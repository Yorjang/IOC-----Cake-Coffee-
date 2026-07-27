import { ChevronRight, Clock, Loader2, PackageOpen, Store, Truck } from 'lucide-react';
import { useOrderList } from '../hooks/useOrderList';
import type { TrackingOrder } from '../types';

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy',
};
const statusClasses: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-sky-100 text-sky-700',
  preparing: 'bg-purple-100 text-purple-700', shipping: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

interface OrderListProps { onSelect: (orderId: string) => void; }

export function OrderList({ onSelect }: OrderListProps) {
  const { orders, loading } = useOrderList();
  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!orders.length) return <div className="rounded-3xl border border-dashed border-border p-12 text-center"><PackageOpen className="mx-auto text-muted-foreground" size={44} /><h2 className="mt-4 font-semibold">Chưa có đơn hàng</h2><p className="mt-1 text-sm text-muted-foreground">Các đơn hàng của bạn sẽ xuất hiện tại đây.</p></div>;

  return <div className="space-y-4">{orders.map(order => <OrderListItem key={order.id} order={order} onSelect={onSelect} />)}</div>;
}

function OrderListItem({ order, onSelect }: { order: TrackingOrder; onSelect: (id: string) => void }) {
  const isPickup = order.fulfillmentType === 'pickup';
  const itemSummary = order.items.slice(0, 2).map(item => `${item.quantity}× ${item.productName}`).join(', ');
  return <button type="button" onClick={() => onSelect(order.id)} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${isPickup ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{isPickup ? <Store size={22} /> : <Truck size={22} />}</div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold text-primary">#{order.orderCode}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[order.orderStatus]}`}>{statusLabels[order.orderStatus]}</span></div><p className="mt-2 truncate text-sm font-medium">{itemSummary || 'Đơn hàng'}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock size={13} />{new Date(order.createdAt).toLocaleString('vi-VN')}</span><span>{isPickup ? `Nhận tại ${order.branch?.name ?? 'chi nhánh'}` : 'Giao tận nơi'}</span></div></div>
    <div className="shrink-0 text-right"><p className="font-bold">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</p><ChevronRight className="ml-auto mt-3 text-muted-foreground" size={20} /></div>
  </button>;
}
