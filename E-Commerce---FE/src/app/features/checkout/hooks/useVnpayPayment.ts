import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { vnpayService } from '../services/vnpayService';

export type VnpayViewStatus = 'redirecting' | 'pending' | 'paid' | 'failed';

export function useVnpayPayment(orderId: string) {
  // Capture the VNPay return query once. After displaying the result, remove
  // it from the address bar without losing the return state on rerenders.
  const [returnQuery] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    return {
      isReturn: query.get('vnpayReturn') === '1',
      returnedStatus: query.get('status'),
      responseCode: query.get('responseCode'),
    };
  });
  const { isReturn, returnedStatus, responseCode } = returnQuery;
  const started = useRef(false);
  const [status, setStatus] = useState<VnpayViewStatus>(
    isReturn ? (returnedStatus === 'success' ? 'pending' : 'failed') : 'redirecting',
  );

  useEffect(() => {
    if (isReturn && window.location.search) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    }
  }, [isReturn]);

  useEffect(() => {
    if (isReturn || started.current) return;
    started.current = true;
    vnpayService.createPaymentUrl(orderId)
      .then(({ paymentUrl }) => window.location.assign(paymentUrl))
      .catch((error: unknown) => {
        setStatus('failed');
        toast.error(error instanceof Error ? error.message : 'Không thể chuyển đến VNPay.');
      });
  }, [isReturn, orderId]);

  useEffect(() => {
    if (!isReturn || status === 'paid' || status === 'failed') return;
    let active = true;
    let attempts = 0;
    const checkStatus = async () => {
      try {
        const response = await fetch(`${env.API_URL}/orders/public/${orderId}`);
        const order = await parseRes(response);
        if (!active) return;
        if (order?.paymentStatus === 'paid') setStatus('paid');
        else if (order?.paymentStatus === 'failed') setStatus('failed');
      } catch {
        // IPN may still be processing; the next poll retries.
      }
      attempts += 1;
    };
    void checkStatus();
    const interval = window.setInterval(() => {
      if (attempts >= 30) {
        window.clearInterval(interval);
        return;
      }
      void checkStatus();
    }, 2000);
    return () => { active = false; window.clearInterval(interval); };
  }, [isReturn, orderId, status]);

  return { status, responseCode };
}
