import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchUserNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import type { NotificationItem } from '../services/notificationService';


export function useNotifications(isLoggedIn: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const prevUnreadRef = useRef<number>(0);

  const loadNotifications = useCallback(async (targetPage = 1, limit = 10) => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserNotifications(targetPage, limit);
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      prevUnreadRef.current = data.unreadCount || 0;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const loadUnreadCountOnly = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
      if (count > prevUnreadRef.current) {
        // If new notifications arrived, refresh list
        loadNotifications(1);
      }
      prevUnreadRef.current = count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isLoggedIn, loadNotifications]);

  const markRead = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markNotificationAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert if error
      loadNotifications(page);
    }
  }, [loadNotifications, page]);

  const markAllRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);

      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      loadNotifications(page);
    }
  }, [loadNotifications, page]);

  // Initial load
  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications(1);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, loadNotifications]);

  // Polling every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      loadUnreadCountOnly();
    }, 30000);

    const onFocus = () => loadUnreadCountOnly();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [isLoggedIn, loadUnreadCountOnly]);

  return {
    notifications,
    unreadCount,
    loading,
    page,
    totalPages,
    total,
    loadNotifications,
    markRead,
    markAllRead,
  };
}
