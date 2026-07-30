import React, { useState } from 'react';
import { X, Bell, CheckCheck, PackageCheck, ShoppingBag, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { NotificationItem } from '../services/notificationService';
import { formatTimeAgo } from './NotificationDropdown';


interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onLoadNotifications: (page: number) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  page,
  totalPages,
  total,
  onLoadNotifications,
  onMarkRead,
  onMarkAllRead,
  onSelectOrder,
}: NotificationsModalProps) {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  if (!isOpen) return null;

  const displayedItems = filterUnreadOnly
    ? notifications.filter((item) => !item.isRead)
    : notifications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-card text-foreground border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Lịch sử thông báo</h2>
              <p className="text-xs text-muted-foreground">
                Tổng cộng {total} thông báo ({unreadCount} chưa đọc)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !filterUnreadOnly
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterUnreadOnly
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
            >
              <CheckCheck size={14} />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
              Đang tải danh sách thông báo...
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Bell size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {filterUnreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </p>
            </div>
          ) : (
            displayedItems.map((item) => {
              const isDelivered = item.type === 'order_delivered';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) onMarkRead(item.id);
                    if (item.orderId && onSelectOrder) {
                      onSelectOrder(item.orderId);
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-xl flex items-start gap-4 transition-colors cursor-pointer ${
                    item.isRead ? 'hover:bg-secondary/40' : 'bg-primary/5 hover:bg-primary/10 border-l-4 border-primary'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    {isDelivered ? <PackageCheck size={20} /> : <ShoppingBag size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-sm ${item.isRead ? 'font-semibold text-foreground/80' : 'font-bold text-foreground'}`}>
                        {item.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-secondary/20">
            <span className="text-xs text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => onLoadNotifications(page - 1)}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary text-foreground transition-colors"
                title="Trang trước"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => onLoadNotifications(page + 1)}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-secondary text-foreground transition-colors"
                title="Trang sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
