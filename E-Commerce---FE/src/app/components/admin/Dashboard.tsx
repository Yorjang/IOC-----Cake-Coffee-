
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Thiếu mã xác thực (Token). Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${env.API_URL}/orders/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
      } else {
        setError(resData.message || "Lỗi khi tải dữ liệu thống kê từ server.");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối tới máy chủ (Server).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-64 items-center justify-center bg-sidebar rounded-2xl p-5 space-y-4">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-sm text-foreground font-semibold">{error || "Có lỗi xảy ra."}</p>
        <button
          type="button"
          onClick={loadStats}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/80 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { stats, weekly, recentOrders } = data;
  const maxRev = Math.max(...weekly.map((d: any) => d.revenue), 1);

  const iconMap: Record<string, any> = {
    DollarSign,
    ShoppingBag,
    Package,
    Users,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <span className="text-sm text-muted-foreground">
          Cập nhật: {new Date().toLocaleDateString("vi-VN")} — {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, icon }: any) => {
          const IconComponent = iconMap[icon] || DollarSign;
          return (
            <div key={label} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className="rounded-xl bg-sidebar-accent p-2">
                  <IconComponent size={16} className="text-primary" />
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-foreground">{value}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-green-400">
                <TrendingUp size={12} />
                {delta}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="mb-4 font-semibold text-foreground">Doanh thu 7 ngày qua</h3>
          <div className="flex items-end gap-3 h-40">
            {weekly.map((d: any) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">{(d.revenue / 1000000).toFixed(1)}M</span>
                <div
                  className="w-full rounded-t-lg bg-primary opacity-80 transition hover:opacity-100"
                  style={{ height: `${(d.revenue / maxRev) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="mb-4 font-semibold text-foreground">Đơn hàng gần đây</h3>
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-foreground">
                    #{o.id} · {o.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.time} — {o.items.slice(0, 22)}…
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Chưa có đơn hàng nào.</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={18} />
          <p className="text-sm text-muted-foreground">Báo cáo tháng hoạt động bình thường.</p>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <AlertCircle className="text-yellow-400 shrink-0" size={18} />
          <p className="text-sm text-muted-foreground">Kiểm tra tồn kho định kỳ tại tab Tồn kho.</p>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={18} />
          <p className="text-sm text-muted-foreground">Tất cả cổng thanh toán hoạt động bình thường.</p>
        </div>
      </div>
    </div>
  );
}
