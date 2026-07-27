import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { parseRes } from "../../../utils/api";

export function AdminRevenue() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const token = getAccessToken();
    try {
      const [revRes, topRes] = await Promise.all([
        fetch(`${env.API_URL}/admin/statistics/revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${env.API_URL}/admin/statistics/top-products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (revRes.ok) setRevenueData(await parseRes(revRes));
      if (topRes.ok) setTopProducts(await parseRes(topRes));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + Number(item.orderCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const maxRevenue = Math.max(...revenueData.map(r => Number(r.revenue || 0)), 1);
  const maxSold = Math.max(...topProducts.map(p => Number(p.totalSold || 0)), 1);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Thống kê doanh thu</h2>
        <span className="text-sm text-muted-foreground">
          Dữ liệu thời gian thực từ hệ thống
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tổng doanh thu", formatMoney(totalRevenue), "Đã hoàn thành"],
          ["Tổng đơn hàng", String(totalOrders), "Đơn thành công"],
          ["Giá trị trung bình", formatMoney(avgOrderValue), "mỗi đơn hàng"],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-2xl bg-sidebar p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">{v}</h3>
            <p className="mt-1 text-xs text-green-400">{s}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-5 font-semibold text-foreground">Biểu đồ doanh thu</h3>
        {revenueData.length > 0 ? (
          <div className="flex items-end gap-3 h-48 overflow-x-auto pb-2">
            {revenueData.map((d: any) => (
              <div key={d.date} className="flex flex-1 min-w-[36px] flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {d.revenue >= 1000000 ? `${(d.revenue / 1000000).toFixed(1)}M` : `${(d.revenue / 1000).toFixed(0)}k`}
                </span>
                <div
                  className="w-full rounded-t-xl bg-primary transition hover:opacity-90 min-h-[4px]"
                  style={{ height: `${(Number(d.revenue) / maxRevenue) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {d.date ? d.date.slice(5) : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-12">Chưa có dữ liệu thống kê doanh thu.</p>
        )}
      </div>

      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 font-semibold text-foreground">Top sản phẩm bán chạy</h3>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((p: any, i: number) => (
              <div key={p.productName || i} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{p.productName}</span>
                    <span className="font-semibold text-primary">{formatMoney(Number(p.totalRevenue))}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sidebar-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(Number(p.totalSold) / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{p.totalSold} đã bán</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">Chưa có dữ liệu sản phẩm bán chạy.</p>
        )}
      </div>
    </div>
  );
}
