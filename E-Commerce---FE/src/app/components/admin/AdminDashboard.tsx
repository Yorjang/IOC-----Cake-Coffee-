import { TrendingUp, DollarSign, ShoppingBag, Users, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { orders } from "../../../data/adminMockData";
import { StatusBadge } from "./AdminShared";

const stats = [
  { label: "Doanh thu hôm nay", value: "4.820.000đ", delta: "+12%", icon: DollarSign },
  { label: "Tổng đơn hàng",     value: "42",          delta: "+8 hôm nay", icon: ShoppingBag },
  { label: "Sản phẩm",          value: "128",          delta: "3 sắp hết", icon: Users },
  { label: "Khách hàng mới",    value: "7",            delta: "+2 so hôm qua", icon: Users },
];

const weekly = [
  { day: "T2", revenue: 3200000 },
  { day: "T3", revenue: 4100000 },
  { day: "T4", revenue: 3800000 },
  { day: "T5", revenue: 5200000 },
  { day: "T6", revenue: 6400000 },
  { day: "T7", revenue: 7800000 },
  { day: "CN", revenue: 4820000 },
];

export function Dashboard() {
  const maxRev = Math.max(...weekly.map(d => d.revenue));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <span className="text-sm text-muted-foreground">Cập nhật: 24/06/2025 – 14:32</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="rounded-xl bg-sidebar-accent p-2"><Icon size={16} className="text-primary" /></span>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-foreground">{value}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-green-400"><TrendingUp size={12} />{delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="mb-4 font-semibold text-foreground">Doanh thu 7 ngày qua</h3>
          <div className="flex items-end gap-3 h-40">
            {weekly.map(d => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">{(d.revenue / 1000000).toFixed(1)}M</span>
                <div className="w-full rounded-t-lg bg-primary opacity-80 transition hover:opacity-100" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="mb-4 font-semibold text-foreground">Đơn hàng gần đây</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-foreground">{o.id} · {o.customer}</p>
                  <p className="text-xs text-muted-foreground">{o.time} – {o.items.slice(0, 22)}…</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-sidebar p-5">
          <Loader2 className="animate-spin text-primary mb-2" size={18} />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu báo cáo tháng…</p>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <AlertCircle className="text-yellow-400 shrink-0" size={18} />
          <p className="text-sm text-muted-foreground">3 sản phẩm sắp hết hàng. Kiểm tra ngay.</p>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={18} />
          <p className="text-sm text-muted-foreground">Tất cả cổng thanh toán hoạt động bình thường.</p>
        </div>
      </div>
    </div>
  );
}
