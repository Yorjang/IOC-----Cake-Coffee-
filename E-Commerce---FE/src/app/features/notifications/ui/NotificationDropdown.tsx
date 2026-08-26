import React from 'react';
import { Bell, CheckCheck, PackageCheck, ShoppingBag, ArrowRight, CircleCheck } from 'lucide-react';
import type { NotificationItem } from '../services/notificationService';


interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectOrder?: (orderId: string) => void;
  onOpenAllModal: () => void;
}

export function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onSelectOrder,
  onOpenAllModal,
}: NotificationDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onClose();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} chưa đọc
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            title="Đánh dấu tất cả đã đọc"
          >
            <CheckCheck size={14} />
            Đọc tất cả
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
        {loading && notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
              <Bell size={20} strokeWidth={1.5} />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Bạn chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.slice(0, 6).map((item) => {
            const isDelivered = item.type === 'order_delivered';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.isRead) onMarkRead(item.id);
                  if (item.orderId && onSelectOrder) {
                    onSelectOrder(item.orderId);
                  }
                  onClose();
                }}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                  item.isRead ? 'hover:bg-secondary/40' : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDelivered
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}
                >
                  {isDelivered ? <PackageCheck size={18} /> : <ShoppingBag size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-semibold truncate ${item.isRead ? 'text-foreground/80' : 'text-foreground font-bold'}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-secondary/20">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAllModal();
          }}
          className="w-full py-2 px-3 rounded-xl text-xs font-medium text-foreground hover:bg-secondary flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Xem tất cả thông báo</span>
          <ArrowRight size={14} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
