import { Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";
import { VIEW_KEYS } from "../../config/appConfig";

export function HeaderNotifications({ setView, user }: { setView: any, user: any }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("read_notifications");
      if (stored) setReadIds(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const fetchAllNotifications = async () => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;

    let items: any[] = [];

    // 1. Fetch DB notifications (Vouchers, Tier Changes, Points, etc.)
    try {
      const res = await fetch(`${env.API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await parseRes(res);
        const list = data?.items || (Array.isArray(data) ? data : (data?.data || []));
        items.push(...list.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          isRead: n.isRead,
          isSystemNotification: true,
          type: n.type,
        })));
      }
    } catch (err) {}

    // 2. Fetch completed orders
    try {
      const resOrder = await fetch(`${env.API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resOrder.ok) {
        const orderData = await parseRes(resOrder);
        const completed = orderData.filter((o: any) => o.orderStatus === 'completed');
        items.push(...completed.slice(0, 10).map((o: any) => ({
          id: o.id,
          orderCode: o.orderCode,
          title: `Đơn hàng #${o.orderCode} đã hoàn tất`,
          message: 'Đơn hàng đã hoàn tất, bạn đã nhận được hàng chưa? Nhấn vào đây để xem chi tiết.',
          createdAt: o.updatedAt || o.createdAt,
          isOrderNotification: true,
        })));
      }
    } catch (err) {}

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setNotifications(items);
  };

  useEffect(() => {
    if (!user) return;

    fetchAllNotifications();

    const handleUpdate = () => fetchAllNotifications();
    window.addEventListener('sb-notifications-updated', handleUpdate);
    window.addEventListener('sb-vouchers-updated', handleUpdate);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sb_notifications_channel');
      channel.onmessage = (e) => {
        if (e.data === 'notifications_updated') fetchAllNotifications();
      };
    } catch (err) {}

    // 3-second real-time background polling
    const interval = setInterval(fetchAllNotifications, 3000);

    return () => {
      window.removeEventListener('sb-notifications-updated', handleUpdate);
      window.removeEventListener('sb-vouchers-updated', handleUpdate);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isItemRead = (item: any) => {
    if (item.isSystemNotification) return item.isRead || readIds.includes(item.id);
    return readIds.includes(item.id);
  };

  const unreadCount = notifications.filter(n => !isItemRead(n)).length;

  const handleMarkAsRead = async (item: any) => {
    if (!readIds.includes(item.id)) {
      const newReadIds = [...readIds, item.id];
      setReadIds(newReadIds);
      localStorage.setItem("read_notifications", JSON.stringify(newReadIds));
    }

    if (item.isSystemNotification && !item.isRead) {
      const token = getAccessToken();
      try {
        await fetch(`${env.API_URL}/notifications/${item.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
  };

  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem("read_notifications", JSON.stringify(newReadIds));

    const token = getAccessToken();
    try {
      await fetch(`${env.API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllNotifications();
    } catch (e) {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center hover:opacity-70 transition-opacity relative p-1.5 rounded-full hover:bg-secondary/50"
        title="Thông báo"
      >
        <Bell size={22} strokeWidth={1.5} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2.5 h-2.5 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-3 w-80 sm:w-84 bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <h3 className="font-bold text-sm text-foreground">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Không có thông báo nào.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((item) => {
                  const read = isItemRead(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleMarkAsRead(item);
                        if (item.isOrderNotification) {
                          setView(VIEW_KEYS.TRACKING, item.id);
                        } else if (item.type === 'new_voucher_available' || item.type === 'loyalty_tier_changed') {
                          setView(VIEW_KEYS.PROFILE);
                        }
                        setShowDropdown(false);
                      }}
                      className={`flex flex-col text-left px-4 py-3 hover:bg-secondary/80 transition-colors cursor-pointer ${!read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <span className={`text-xs font-bold ${!read ? 'text-primary font-serif' : 'text-foreground'}`}>
                          {item.title}
                        </span>
                        {!read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
