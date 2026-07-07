const monthly = [
  { month: "T1", revenue: 42000000, orders: 310 },
  { month: "T2", revenue: 38000000, orders: 280 },
  { month: "T3", revenue: 55000000, orders: 420 },
  { month: "T4", revenue: 61000000, orders: 470 },
  { month: "T5", revenue: 72000000, orders: 560 },
  { month: "T6", revenue: 48000000, orders: 380 },
];

const topProducts = [
  { name: "Combo Tiramisu + Latte",      revenue: "8.900.000đ", units: 100 },
  { name: "Bánh sinh nhật socola",       revenue: "7.000.000đ", units: 20 },
  { name: "Cafe Latte",                  revenue: "6.600.000đ", units: 120 },
  { name: "Matcha Latte",               revenue: "4.720.000đ", units: 80 },
  { name: "Combo sinh nhật mini",        revenue: "3.990.000đ", units: 10 },
];

export function AdminRevenue() {
  const max = Math.max(...monthly.map(m => m.revenue));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Thống kê doanh thu</h2>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none">
          <option>6 tháng gần nhất</option>
          <option>12 tháng</option>
          <option>Năm 2025</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tổng doanh thu",    "316.000.000đ", "+18% so tháng trước"],
          ["Tổng đơn hàng",    "2.420",         "+24 đơn hôm nay"],
          ["Giá trị trung bình","130.578đ",      "mỗi đơn hàng"],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-2xl bg-sidebar p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">{v}</h3>
            <p className="mt-1 text-xs text-green-400">{s}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-5 font-semibold text-foreground">Doanh thu theo tháng</h3>
        <div className="flex items-end gap-4 h-48">
          {monthly.map(d => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">{(d.revenue / 1000000).toFixed(0)}M</span>
              <div className="w-full rounded-t-xl bg-primary transition hover:opacity-90" style={{ height: `${(d.revenue / max) * 100}%` }} />
              <span className="text-xs text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 font-semibold text-foreground">Top sản phẩm bán chạy</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span className="font-semibold text-primary">{p.revenue}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-sidebar-accent">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(p.units / 120) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{p.units} sp</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
