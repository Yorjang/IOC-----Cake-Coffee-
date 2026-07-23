import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';

interface VnpayPaymentUrlResponse {
  paymentUrl: string;
  expiresAt: string;
}

export const vnpayService = {
  async createPaymentUrl(orderId: string): Promise<VnpayPaymentUrlResponse> {
    const response = await fetch(`${env.API_URL}/payments/vnpay/${orderId}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'vn' }),
    });
    const data = await parseRes(response);
    if (!response.ok) throw new Error(data?.message ?? 'Không thể khởi tạo thanh toán VNPay.');
    return data as VnpayPaymentUrlResponse;
  },
};
