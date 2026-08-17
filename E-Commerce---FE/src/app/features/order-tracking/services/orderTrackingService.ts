import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';
import type { TrackingOrder } from '../types';

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export async function getTrackingOrder(orderId: string): Promise<TrackingOrder> {
  const response = await fetch(`${env.API_URL}/orders/public/${orderId}`, { headers: authHeaders() });
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể tải thông tin đơn hàng');
  return data as TrackingOrder;
}

export async function cancelTrackingOrder(orderId: string): Promise<TrackingOrder> {
  const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
  const sessionId = localStorage.getItem('sb_cart_session_id');
  if (sessionId) headers['x-session-id'] = sessionId;
  const response = await fetch(`${env.API_URL}/orders/public/${orderId}/cancel`, {
    method: 'PATCH',
    headers,
  });
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể hủy đơn hàng');
  return data as TrackingOrder;
}

const RECENT_ORDER_IDS_KEY = 'sb_recent_orders';

export function rememberTrackingOrder(orderId: string): void {
  const ids = getRememberedOrderIds().filter(id => id !== orderId);
  localStorage.setItem(RECENT_ORDER_IDS_KEY, JSON.stringify([orderId, ...ids].slice(0, 20)));
  localStorage.setItem('sb_active_order', orderId);
}

export function getRememberedOrderIds(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_ORDER_IDS_KEY) ?? '[]');
    const ids = Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
    const legacyId = localStorage.getItem('sb_active_order');
    return legacyId && !ids.includes(legacyId) ? [legacyId, ...ids] : ids;
  } catch {
    return [];
  }
}

export async function getTrackingOrders(): Promise<TrackingOrder[]> {
  const token = getAccessToken();
  const accountOrders = token ? await fetch(`${env.API_URL}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async response => {
    const data = await parseRes(response);
    if (!response.ok) throw new Error(data?.message ?? 'Không thể tải danh sách đơn hàng');
    return data as TrackingOrder[];
  }) : [];

  const accountIds = new Set(accountOrders.map(order => order.id));
  const rememberedOrders = await Promise.all(
    getRememberedOrderIds()
      .filter(id => !accountIds.has(id))
      .map(id => getTrackingOrder(id).catch(() => null)),
  );

  return [...accountOrders, ...rememberedOrders.filter((order): order is TrackingOrder => order !== null)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
