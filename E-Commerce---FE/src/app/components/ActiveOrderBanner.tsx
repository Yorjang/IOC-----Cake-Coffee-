import { parseRes } from '../../utils/api';
import { useState, useEffect } from "react";
import { Package, X, ChevronRight } from "lucide-react";
import { env } from "../../config/env";
import { getAccessToken } from "./authSession";

export function ActiveOrderBanner({ lastCreatedOrder, onClick, isHidden }: { lastCreatedOrder?: any, onClick: (orderId: string) => void, isHidden?: boolean }) {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  // Sync with lastCreatedOrder
  useEffect(() => {
    if (lastCreatedOrder) {
      setActiveOrder(lastCreatedOrder);
      setDismissed(false);
    } else {
      setActiveOrder(null);
    }
  }, [lastCreatedOrder]);

  // Initial fetch to restore active order if refreshed
  useEffect(() => {
    if (activeOrder || dismissed) return;
    const fetchLatestOrder = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(`${env.API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await parseRes(res);
          // Find the most recent active order
          const active = data.find((o: any) => !['completed', 'cancelled'].includes(o.orderStatus));
          if (active) {
            setActiveOrder(active);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recent orders:", err);
      }
    };
    fetchLatestOrder();
  }, [activeOrder, dismissed]);

  // Polling for updates
  useEffect(() => {
    if (!activeOrder || dismissed || ['completed', 'cancelled'].includes(activeOrder.orderStatus)) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${env.API_URL}/orders/public/${activeOrder.id}`);
        if (res.ok) {
          const updated = await parseRes(res);
          setActiveOrder(updated);
          if (['completed', 'cancelled'].includes(updated.orderStatus)) {
            // Auto dismiss after a few seconds when completed
            setTimeout(() => setDismissed(true), 5000);
          }
        }
      } catch (err) {
        // ignore
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.orderStatus, dismissed]);

  if (!activeOrder || dismissed || isHidden) return null;
  if (['completed', 'cancelled'].includes(activeOrder.orderStatus) && dismissed) return null;

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string, color: string, pulse: string }> = {
      'pending': { label: 'Chờ xác nhận', color: 'text-amber-500', pulse: 'bg-amber-500' },
      'confirmed': { label: 'Đã xác nhận', color: 'text-blue-500', pulse: 'bg-blue-500' },
      'preparing': { label: 'Đang chuẩn bị', color: 'text-yellow-500', pulse: 'bg-yellow-500' },
      'shipping': { label: 'Đang giao hàng', color: 'text-indigo-500', pulse: 'bg-indigo-500' },
      'completed': { label: 'Đã hoàn thành', color: 'text-emerald-500', pulse: 'bg-emerald-500' },
      'cancelled': { label: 'Đã huỷ', color: 'text-red-500', pulse: 'bg-red-500' }
    };
    return map[status] || { label: 'Đang xử lý', color: 'text-primary', pulse: 'bg-primary' };
  };

  const info = getStatusInfo(activeOrder.orderStatus);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300">
      <div 
        className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl p-3 pl-4 pr-2 shadow-lg shadow-black/5 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onClick(activeOrder.id)}
      >
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
           <Package size={20} className={info.color} />
           {!['completed', 'cancelled'].includes(activeOrder.orderStatus) && (
             <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center">
               <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${info.pulse} opacity-75`}></span>
               <span className={`relative inline-flex size-2 rounded-full ${info.pulse}`}></span>
             </span>
           )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold truncate leading-tight">Đơn hàng #{activeOrder.orderCode}</p>
          <p className={`text-xs font-medium truncate ${info.color}`}>{info.label}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick(activeOrder.id);
            }}
          >
            <ChevronRight size={18} />
          </button>
          <button 
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
