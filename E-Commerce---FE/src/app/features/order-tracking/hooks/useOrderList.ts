import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getTrackingOrders } from '../services/orderTrackingService';
import type { TrackingOrder } from '../types';

export function useOrderList() {
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setOrders(await getTrackingOrders());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { orders, loading, refresh };
}
