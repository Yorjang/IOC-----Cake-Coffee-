import { parseRes } from '../../../utils/api';

import {
  AlertCircle,
  CircleCheck,
  DollarSign,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { StatusBadge } from "./AdminShared";

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError("Thiếu mã xác thực (Token). Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${env.API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await parseRes(res);
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
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-[12px] border border-border">
        <Loader2 className="animate-spin text-[#D85A30]" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-64 items-center justify-center bg-sidebar rounded-[12px] border border-border p-4 space-y-4">
        <AlertCircle className="text-amber-500" size={40} />
        <p className="text-sm text-muted-foreground font-semibold">{error || "Có lỗi xảy ra."}</p>
        <button
          type="button"
          onClick={loadStats}
          className="rounded-full bg-[#D85A30] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { stats, weekly, recentOrders, lowStockCount } = data;

  const iconMap: Record<string, any> = {
    DollarSign,
    ShoppingBag,
    Package,
    Users,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Analytics <span className="font-light text-muted-foreground">Dashboard</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cập nhật: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm border border-border hover:bg-muted transition">
            Export Report
          </button>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition">
            New Project
          </button>
        </div>
      </div>
      
      {/* Top Section: Metrics + Main Chart */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Metrics 2x2 Grid */}
        <div className="lg:col-span-5 xl:col-span-4 grid gap-4 grid-cols-2">
          {stats.map(({ label, value, delta, icon }: any) => {
            const IconComponent = iconMap[icon] || DollarSign;
            const isRevenue = label.toLowerCase().includes("doanh thu");
            const deltaNumber = Number(delta) || 0;
            const isStable = deltaNumber === 0;
            return (
              <div 
                key={label} 
                className="rounded-xl bg-white p-5 shadow-sm border border-border/50 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500">
                    <IconComponent size={16} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">{value}</h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${isStable ? "bg-gray-100 text-gray-600" : isRevenue ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {isStable ? "—" : `${deltaNumber > 0 ? "+" : ""}${deltaNumber}%`}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{isStable ? "Không đổi" : "So với hôm qua"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Main Chart */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl bg-white p-5 shadow-sm border border-border/50 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="font-semibold text-foreground">Biến động gần đây</h3>
            <div className="flex items-center gap-2">
              <select className="rounded border border-border bg-transparent px-2 py-1 text-sm outline-none">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => val === 0 ? '0' : `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Orders & System Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders Card */}
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Đơn hàng gần đây</h3>
            <button className="text-sm font-medium text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Khách hàng</th>
                  <th className="pb-3 font-medium">Mã ĐH</th>
                  <th className="pb-3 font-medium">Thời gian</th>
                  <th className="pb-3 font-medium text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((o: any) => {
                  const initials = o.customer.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <tr key={o.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                            {initials}
                          </div>
                          <span className="font-medium">{o.customer}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">#{o.id}</td>
                      <td className="py-3 text-muted-foreground">{o.time}</td>
                      <td className="py-3 text-right">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">Chưa có đơn hàng nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-border/50 flex flex-col">
          <h3 className="mb-4 font-semibold text-foreground">Trạng thái hệ thống</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-green-100 p-1">
                <CircleCheck className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Báo cáo hoạt động bình thường</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1">
                <AlertCircle className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cảnh báo tồn kho</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Number(lowStockCount) > 0
                    ? `Có ${Number(lowStockCount)} phiên bản sắp hết hàng`
                    : "Không có phiên bản sắp hết hàng"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1">
                <CircleCheck className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cổng thanh toán</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tất cả cổng đang online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


