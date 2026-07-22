import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cancelTrackingOrder, getTrackingOrder } from '../services/orderTrackingService';
import type { TrackingOrder } from '../types';

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (showError = false) => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      setOrder(await getTrackingOrder(orderId));
    } catch (error) {
      if (showError) toast.error(error instanceof Error ? error.message : 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh(true);
    const intervalId = window.setInterval(() => void refresh(false), 10000);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const cancelOrder = useCallback(async () => {
    try {
      setOrder(await cancelTrackingOrder(orderId));
      toast.success('Đã hủy đơn hàng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy đơn hàng');
    }
  }, [orderId]);

  return { order, loading, cancelOrder };
}
