import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';

export async function getCatalogProducts(branchId?: string): Promise<unknown[]> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
  const response = await fetch(`${env.API_URL}/products${query}`);
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể tải menu theo chi nhánh.');
  return Array.isArray(data) ? data : [];
}
