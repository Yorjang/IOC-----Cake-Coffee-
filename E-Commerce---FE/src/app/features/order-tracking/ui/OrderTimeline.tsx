import { Check, PackageX } from 'lucide-react';
import type { FulfillmentType, OrderStatus, TrackingStep } from '../types';

const FLOWS: Record<FulfillmentType, TrackingStep[]> = {
  delivery: [
    { key: 'pending', label: 'Chờ xác nhận', description: 'Đơn hàng đã được tiếp nhận' },
    { key: 'confirmed', label: 'Đã xác nhận', description: 'Cửa hàng đã xác nhận đơn' },
    { key: 'preparing', label: 'Đang chuẩn bị', description: 'Món đang được chuẩn bị' },
    { key: 'shipping', label: 'Đang giao', description: 'Đơn đang trên đường giao' },
    { key: 'completed', label: 'Hoàn thành', description: 'Đã giao thành công' },
  ],
  pickup: [
    { key: 'pending', label: 'Chờ xác nhận', description: 'Đơn hàng đã được tiếp nhận' },
    { key: 'confirmed', label: 'Đã xác nhận', description: 'Chi nhánh đã xác nhận đơn' },
    { key: 'preparing', label: 'Đang chuẩn bị', description: 'Món đang được chuẩn bị' },
    { key: 'completed', label: 'Hoàn thành', description: 'Đã nhận hàng tại chi nhánh' },
  ],
};

interface OrderTimelineProps {
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
}

export function OrderTimeline({ fulfillmentType, status }: OrderTimelineProps) {
  if (status === 'cancelled') {
    return <div className="flex items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-600"><PackageX /> Đơn hàng đã bị hủy</div>;
  }
  const steps = FLOWS[fulfillmentType];
  const currentIndex = Math.max(0, steps.findIndex(step => step.key === status));

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-card px-6 py-7 shadow-sm">
      <div className="relative flex min-w-[680px] justify-between">
        <div className="absolute left-10 right-10 top-5 h-1 rounded bg-muted" />
        <div className="absolute left-10 top-5 h-1 rounded bg-green-500 transition-all" style={{ width: `calc((100% - 80px) * ${currentIndex / (steps.length - 1)})` }} />
        {steps.map((step, index) => {
          const reached = index <= currentIndex;
          return <div key={step.key} className="relative z-10 flex w-32 flex-col items-center text-center">
            <div className={`flex size-10 items-center justify-center rounded-full border-4 ${reached ? 'border-green-100 bg-green-500 text-white' : 'border-muted bg-card text-muted-foreground'}`}>
              {reached ? <Check size={18} strokeWidth={3} /> : <span className="size-2 rounded-full bg-muted-foreground/40" />}
            </div>
            <p className={`mt-3 text-sm font-semibold ${reached ? 'text-green-600' : 'text-muted-foreground'}`}>{step.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
          </div>;
        })}
      </div>
    </div>
  );
}
