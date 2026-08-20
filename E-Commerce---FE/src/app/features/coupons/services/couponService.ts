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

export async function getAvailableCoupons(branchId?: string, userId?: string): Promise<AvailableCoupon[]> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);
  if (userId) params.append('userId', userId);

  const queryString = params.toString();
  const url = `${env.API_URL}/coupons/public${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, { headers });
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể tải danh sách voucher.');
  return Array.isArray(data) ? data : [];
}
