import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';

export interface NotificationItem {
  id: string;
  userId: string;
  orderId?: string | null;
  type: 'order_placed' | 'order_delivered' | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchUserNotifications(page = 1, limit = 10): Promise<PaginatedNotifications> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return { items: [], total: 0, unreadCount: 0, page: 1, limit: 10, totalPages: 1 };
  }

  const response = await fetch(`${env.API_URL}/api/notifications?page=${page}&limit=${limit}`, {
    headers,
  });

  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể tải danh sách thông báo');
  return data as PaginatedNotifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return 0;

  const response = await fetch(`${env.API_URL}/api/notifications/unread-count`, {
    headers,
  });

  const data = await parseRes(response);
  if (!response.ok) return 0;
  return Number(data?.count ?? 0);
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
  const response = await fetch(`${env.API_URL}/api/notifications/${id}/read`, {
    method: 'PUT',
    headers,
  });

  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể đánh dấu đã đọc');
  return data as NotificationItem;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
  const response = await fetch(`${env.API_URL}/api/notifications/read-all`, {
    method: 'PUT',
    headers,
  });

  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message ?? 'Không thể đánh dấu tất cả đã đọc');
  return Number(data?.affected ?? 0);
}
