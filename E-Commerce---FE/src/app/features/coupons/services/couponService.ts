import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';

export interface AvailableCoupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  productId?: string | null;
  categoriesId?: string | null;
  targetSize?: string | null;
  perCustomerLimit?: number | null;
}

export async function getAvailableCoupons(branchId?: string): Promise<AvailableCoupon[]> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${env.API_URL}/coupons/public`;
  if (branchId) {
    url += `?branchId=${encodeURIComponent(branchId)}`;
  }

  const response = await fetch(url, { headers });
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể tải danh sách voucher.');
  return Array.isArray(data) ? data : [];
}
