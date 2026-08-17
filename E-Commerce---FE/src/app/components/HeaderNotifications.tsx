import { Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";
import { VIEW_KEYS } from "../../config/appConfig";

export function HeaderNotifications({ setView, user }: { setView: any, user: any }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("read_notifications");
      if (stored) setReadIds(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchOrders = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(`${env.API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await parseRes(res);
          const completed = data.filter((o: any) => o.orderStatus === 'completed');
          setCompletedOrders(completed.slice(0, 10)); // max 10
        }
      } catch (err) {}
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds for faster updates
    return () => clearInterval(interval);
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

  const unreadCount = completedOrders.filter(o => !readIds.includes(o.id)).length;

  const handleMarkAsRead = (orderId: string) => {
    if (readIds.includes(orderId)) return;
    const newReadIds = [...readIds, orderId];
    setReadIds(newReadIds);
    localStorage.setItem("read_notifications", JSON.stringify(newReadIds));
  };

  const handleMarkAllAsRead = () => {
    const allIds = completedOrders.map(o => o.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem("read_notifications", JSON.stringify(newReadIds));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center hover:opacity-70 transition-opacity relative"
      >
        <Bell size={22} strokeWidth={1.5} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-2 h-2 animate-pulse" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-[11px] font-medium text-primary hover:underline">
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {completedOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Không có thông báo nào.
              </div>
            ) : (
              <div className="flex flex-col">
                {completedOrders.map(order => {
                  const isRead = readIds.includes(order.id);
                  return (
                    <button
                      key={order.id}
                      onClick={() => {
                        handleMarkAsRead(order.id);
                        setView(VIEW_KEYS.TRACKING, order.id);
                        setShowDropdown(false);
                      }}
                      className={`flex flex-col text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/80 transition-colors ${!isRead ? 'bg-secondary/30' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-sm font-semibold ${!isRead ? 'text-primary' : 'text-foreground'}`}>
                          Đơn hàng #{order.orderCode} đã hoàn tất
                        </span>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Đơn hàng đã hoàn tất, bạn đã nhận được hàng chưa? Nhấn vào đây để xem chi tiết.
                      </p>
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
