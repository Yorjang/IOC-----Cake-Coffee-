import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { parseRes } from "../../../utils/api";

export function AdminRevenue() {
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
      const res = await fetch(`${env.API_URL}/orders/dashboard/revenue`, {
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
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center bg-sidebar rounded-2xl p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadStats} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground font-medium transition hover:opacity-90">
          Thử lại
        </button>
      </div>
    );
  }

  const monthly = data?.monthly || [];
  const topProducts = data?.topProducts || [];
  const summary = data?.summary || [];

  const max = Math.max(...monthly.map((m: any) => m.revenue), 1);
  const maxUnits = Math.max(...topProducts.map((p: any) => p.units), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Thống kê doanh thu</h2>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none">
          <option>6 tháng gần nhất</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map(([l, v, s]: any) => (
          <div key={l} className="rounded-2xl bg-sidebar p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">{v}</h3>
            <p className="mt-1 text-xs text-green-400">{s}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-5 font-semibold text-foreground">Doanh thu theo tháng</h3>
        {monthly.length > 0 ? (
          <div className="flex items-end gap-4 h-48">
            {monthly.map((d: any) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs text-muted-foreground">{(d.revenue / 1000000).toFixed(0)}M</span>
                <div className="w-full rounded-t-xl bg-primary transition hover:opacity-90" style={{ height: `${(d.revenue / max) * 100}%`, minHeight: '4px' }} />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-muted-foreground">Chưa có dữ liệu doanh thu</div>
        )}
      </div>
      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 font-semibold text-foreground">Top sản phẩm bán chạy</h3>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((p: any, i: number) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-semibold text-primary">{p.revenue}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sidebar-accent">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{p.units} sp</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">Chưa có dữ liệu sản phẩm</div>
        )}
      </div>
    </div>
  );
}
