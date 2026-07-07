import React, { useState } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown
} from "lucide-react";

import { banners, categories, options, orders, products, reviews, statusColor, users, vouchers } from "../../data/adminMockData";

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function AdminBtn({ children, variant = "primary", onClick }: any) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary/80"
    : variant === "danger"
    ? "bg-red-100 text-red-700 hover:bg-red-200"
    : "bg-sidebar-accent text-primary-foreground hover:bg-sidebar-accent/80";
  return <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm transition ${cls}`}>{children}</button>;
}

function TableHeader({ cols }: { cols: string[] }) {
  return <thead><tr className="border-b border-sidebar-accent">{cols.map(c => <th key={c} className="pb-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{c}</th>)}</tr></thead>;
}

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Dashboard() {
  const stats = [
    { label: "Doanh thu hÃ´m nay", value: "4.820.000Ä‘", delta: "+12%", icon: DollarSign },
    { label: "Tá»•ng Ä‘Æ¡n hÃ ng", value: "42", delta: "+8 hÃ´m nay", icon: ShoppingBag },
    { label: "Sáº£n pháº©m", value: "128", delta: "3 sáº¯p háº¿t", icon: Package },
    { label: "KhÃ¡ch hÃ ng má»›i", value: "7", delta: "+2 so hÃ´m qua", icon: Users },
  ];
  const weekly = [
    { day: "T2", revenue: 3200000, orders: 28 },
    { day: "T3", revenue: 4100000, orders: 35 },
    { day: "T4", revenue: 3800000, orders: 31 },
    { day: "T5", revenue: 5200000, orders: 44 },
    { day: "T6", revenue: 6400000, orders: 52 },
    { day: "T7", revenue: 7800000, orders: 63 },
    { day: "CN", revenue: 4820000, orders: 42 },
  ];
  const maxRev = Math.max(...weekly.map(d => d.revenue));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
       <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
       <span className="text-sm text-muted-foreground">Cáº­p nháº­t: 24/06/2025 â€” 14:32</span>
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
         <h3 className="mb-4 font-semibold text-foreground">Doanh thu 7 ngÃ y qua</h3>
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
         <h3 className="mb-4 font-semibold text-foreground">ÄÆ¡n hÃ ng gáº§n Ä‘Ã¢y</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                 <p className="text-foreground">{o.id} Â· {o.customer}</p>
                 <p className="text-xs text-muted-foreground">{o.time} â€” {o.items.slice(0, 22)}â€¦</p>
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
         <p className="text-sm text-muted-foreground">Äang táº£i dá»¯ liá»‡u bÃ¡o cÃ¡o thÃ¡ngâ€¦</p>
        </div>
       <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <AlertCircle className="text-yellow-400 shrink-0" size={18} />
         <p className="text-sm text-muted-foreground">3 sáº£n pháº©m sáº¯p háº¿t hÃ ng. Kiá»ƒm tra ngay.</p>
        </div>
       <div className="rounded-2xl bg-sidebar p-5 flex items-center gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={18} />
         <p className="text-sm text-muted-foreground">Táº¥t cáº£ cá»•ng thanh toÃ¡n hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng.</p>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminProducts() {
  const [search, setSearch] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ sáº£n pháº©m</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />ThÃªm sáº£n pháº©m</span></AdminBtn>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground" placeholder="TÃ¬m sáº£n pháº©mâ€¦" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none"><option>Táº¥t cáº£ danh má»¥c</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none"><option>Táº¥t cáº£ tráº¡ng thÃ¡i</option><option>Äang bÃ¡n</option><option>Háº¿t hÃ ng</option><option>Äáº·t trÆ°á»›c</option></select>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Sáº£n pháº©m", "Danh má»¥c", "GiÃ¡", "Tá»“n kho", "Tráº¡ng thÃ¡i", "Thao tÃ¡c"]} />
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <img src={p.img} alt={p.name} className="size-10 rounded-lg object-cover" />
                    <span className="text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">{p.cat}</td>
                <td className="py-3 font-semibold text-primary">{p.price}</td>
                <td className="py-3 text-muted-foreground">{p.stock === 999 ? "âˆž" : p.stock}</td>
                <td className="py-3"><StatusBadge status={p.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Eye size={14} /></AdminBtn>
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} sáº£n pháº©m</p>
    </div>
  );
}

// â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminCategories() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ danh má»¥c</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />ThÃªm danh má»¥c</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "TÃªn danh má»¥c", "Slug", "Sá»‘ sáº£n pháº©m", "Tráº¡ng thÃ¡i", "Thao tÃ¡c"]} />
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{c.id}</td>
                <td className="py-3 font-medium text-foreground">{c.name}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="py-3 text-muted-foreground">{c.count}</td>
                <td className="py-3"><StatusBadge status={c.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// â”€â”€ Options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminOptions() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ tÃ¹y chá»n sáº£n pháº©m</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />ThÃªm tÃ¹y chá»n</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "TÃªn tÃ¹y chá»n", "Kiá»ƒu", "GiÃ¡ trá»‹", "Ãp dá»¥ng cho", "Thao tÃ¡c"]} />
          <tbody>
            {options.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{o.id}</td>
                <td className="py-3 font-medium text-foreground">{o.name}</td>
                <td className="py-3"><span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs text-primary">{o.type}</span></td>
                <td className="py-3 text-muted-foreground">{o.values}</td>
                <td className="py-3 text-xs text-muted-foreground">{o.applies}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">ThÃªm tÃ¹y chá»n má»›i</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="TÃªn tÃ¹y chá»n" />
          <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Kiá»ƒu: Size</option><option>TÃ¹y chá»‰nh</option><option>Topping</option><option>Text</option></select>
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="GiÃ¡ trá»‹ (ngÄƒn cÃ¡ch báº±ng /)" />
          <AdminBtn>LÆ°u tÃ¹y chá»n</AdminBtn>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminOrders() {
  const [filter, setFilter] = useState("Táº¥t cáº£");
  const tabs = ["Táº¥t cáº£", "XÃ¡c nháº­n", "Äang chuáº©n bá»‹", "Äang giao", "HoÃ n thÃ nh", "Huá»·"];
  const filtered = filter === "Táº¥t cáº£" ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ Ä‘Æ¡n hÃ ng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-40" placeholder="TÃ¬m Ä‘Æ¡n #SBâ€¦" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1.5 text-sm transition ${filter === t ? "bg-primary text-primary-foreground" : "bg-sidebar text-muted-foreground hover:bg-sidebar-accent"}`}>{t}</button>
        ))}
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["MÃ£ Ä‘Æ¡n", "KhÃ¡ch hÃ ng", "Sáº£n pháº©m", "Tá»•ng tiá»n", "Giá»", "Tráº¡ng thÃ¡i", "Thao tÃ¡c"]} />
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono text-xs text-primary">{o.id}</td>
                <td className="py-3 text-foreground">{o.customer}</td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">{o.items}</td>
                <td className="py-3 font-semibold text-foreground">{o.total}</td>
                <td className="py-3 text-muted-foreground">{o.time}</td>
                <td className="py-3"><StatusBadge status={o.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Eye size={14} /></AdminBtn>
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">KhÃ´ng cÃ³ Ä‘Æ¡n hÃ ng nÃ o trong tráº¡ng thÃ¡i nÃ y.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminUsers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-44" placeholder="TÃ¬m tÃªn, emailâ€¦" /></div>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "Há» tÃªn", "Email", "SÄT", "ÄÆ¡n hÃ ng", "Tá»•ng chi", "Tham gia", "PhÃ¢n loáº¡i", "Thao tÃ¡c"]} />
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 text-muted-foreground">{u.id}</td>
                <td className="py-3 font-medium text-foreground">{u.name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3 text-muted-foreground">{u.phone}</td>
                <td className="py-3 text-center text-muted-foreground">{u.orders}</td>
                <td className="py-3 text-primary font-medium">{u.total}</td>
                <td className="py-3 text-muted-foreground">{u.joined}</td>
                <td className="py-3"><StatusBadge status={u.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Eye size={14} /></AdminBtn>
                    <AdminBtn variant="danger"><XCircle size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// â”€â”€ Reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminReviews() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ Ä‘Ã¡nh giÃ¡</h2>
        <div className="flex gap-2">
          <span className="rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">2 chá» duyá»‡t</span>
        </div>
      </div>
      <div className="grid gap-4">
        {reviews.map(r => (
          <div key={r.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-primary text-xs font-bold">{r.user[0]}</div>
                  <div>
                    <p className="font-medium text-foreground">{r.user}</p>
                    <p className="text-xs text-muted-foreground">{r.date} Â· {r.product}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? "fill-[sidebar-primary] text-[sidebar-primary]" : "text-[sidebar-accent]"} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                <div className="flex gap-2 mt-1">
                  {r.status === "Chá» duyá»‡t" && <AdminBtn><CheckCircle size={14} /></AdminBtn>}
                  <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                  <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Vouchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminVouchers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ voucher</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Táº¡o voucher</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["MÃ£", "Kiá»ƒu", "GiÃ¡ trá»‹", "ÄÆ¡n tá»‘i thiá»ƒu", "ÄÃ£ dÃ¹ng", "Giá»›i háº¡n", "Háº¿t háº¡n", "Tráº¡ng thÃ¡i", "Thao tÃ¡c"]} />
          <tbody>
            {vouchers.map(v => (
              <tr key={v.code} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                <td className="py-3 text-muted-foreground">{v.type}</td>
                <td className="py-3 font-semibold text-foreground">{v.value}</td>
                <td className="py-3 text-muted-foreground">{v.min}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-[sidebar-accent]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(v.used / v.limit) * 100}%` }} />
                    </div>
                    <span className="text-muted-foreground">{v.used}/{v.limit}</span>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">{v.limit}</td>
                <td className="py-3 text-muted-foreground">{v.expiry}</td>
                <td className="py-3"><StatusBadge status={v.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Táº¡o voucher má»›i</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="MÃ£ voucher (VD: SUMMER30)" />
          <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Loáº¡i: Pháº§n trÄƒm (%)</option><option>Cá»‘ Ä‘á»‹nh (Ä‘)</option></select>
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="GiÃ¡ trá»‹ (VD: 20)" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="ÄÆ¡n tá»‘i thiá»ƒu (Ä‘)" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Giá»›i háº¡n lÆ°á»£t dÃ¹ng" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" type="date" />
          <div className="sm:col-span-2 lg:col-span-1">
            <AdminBtn>Táº¡o voucher</AdminBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminBanners() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quáº£n lÃ½ banner</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />ThÃªm banner</span></AdminBtn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map(b => (
          <div key={b.id} className="rounded-2xl bg-sidebar overflow-hidden transition hover:bg-sidebar-accent">
            <img src={b.img} alt={b.title} className="h-28 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{b.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.position} Â· {b.start} â†’ {b.end}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 flex gap-2">
                <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                <AdminBtn variant="ghost"><ToggleLeft size={14} /></AdminBtn>
                <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border-2 border-dashed border-sidebar-accent p-8 text-center">
        <Image size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">KÃ©o tháº£ hoáº·c <span className="text-primary cursor-pointer">chá»n áº£nh</span> Ä‘á»ƒ táº¡o banner má»›i</p>
      </div>
    </div>
  );
}

// â”€â”€ Revenue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminRevenue() {
  const monthly = [
    { month: "T1", revenue: 42000000, orders: 310 },
    { month: "T2", revenue: 38000000, orders: 280 },
    { month: "T3", revenue: 55000000, orders: 420 },
    { month: "T4", revenue: 61000000, orders: 470 },
    { month: "T5", revenue: 72000000, orders: 560 },
    { month: "T6", revenue: 48000000, orders: 380 },
  ];
  const max = Math.max(...monthly.map(m => m.revenue));
  const topProducts = [
    { name: "Combo Tiramisu + Latte", revenue: "8.900.000Ä‘", units: 100 },
    { name: "BÃ¡nh sinh nháº­t socola", revenue: "7.000.000Ä‘", units: 20 },
    { name: "Cafe Latte", revenue: "6.600.000Ä‘", units: 120 },
    { name: "Matcha Latte", revenue: "4.720.000Ä‘", units: 80 },
    { name: "Combo sinh nháº­t mini", revenue: "3.990.000Ä‘", units: 10 },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Thá»‘ng kÃª doanh thu</h2>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none"><option>6 thÃ¡ng gáº§n nháº¥t</option><option>12 thÃ¡ng</option><option>NÄƒm 2025</option></select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Tá»•ng doanh thu", "316.000.000Ä‘", "+18% so thÃ¡ng trÆ°á»›c"], ["Tá»•ng Ä‘Æ¡n hÃ ng", "2.420", "+24 Ä‘Æ¡n hÃ´m nay"], ["GiÃ¡ trá»‹ trung bÃ¬nh", "130.578Ä‘", "má»—i Ä‘Æ¡n hÃ ng"]].map(([l, v, s]) => (
          <div key={l} className="rounded-2xl bg-sidebar p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">{v}</h3>
            <p className="mt-1 text-xs text-green-400">{s}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-5 font-semibold text-foreground">Doanh thu theo thÃ¡ng</h3>
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
        <h3 className="mb-4 font-semibold text-foreground">Top sáº£n pháº©m bÃ¡n cháº¡y</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span className="font-semibold text-primary">{p.revenue}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[sidebar-accent]">
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

// â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">CÃ i Ä‘áº·t há»‡ thá»‘ng</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">ThÃ´ng tin cá»­a hÃ ng</h3>
          {["TÃªn cá»­a hÃ ng", "Email liÃªn há»‡", "Sá»‘ Ä‘iá»‡n thoáº¡i", "Äá»‹a chá»‰"].map((label, i) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={["Sweet Bean Coffee & Cake", "hello@sweetbean.vn", "0909 888 777", "123 Nguyá»…n Huá»‡, Q1, TP.HCM"][i]} />
            </div>
          ))}
          <AdminBtn>LÆ°u thay Ä‘á»•i</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cáº¥u hÃ¬nh giao hÃ ng</h3>
          {[["PhÃ­ giao hÃ ng cÆ¡ báº£n", "25.000Ä‘"], ["Miá»…n phÃ­ tá»«", "200.000Ä‘"], ["BÃ¡n kÃ­nh giao (km)", "15"], ["Thá»i gian giao (phÃºt)", "45-90"]].map(([l, v]) => (
            <div key={l}>
              <label className="mb-1 block text-xs text-muted-foreground">{l}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={v} />
            </div>
          ))}
          <AdminBtn>LÆ°u cáº¥u hÃ¬nh</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cá»•ng thanh toÃ¡n</h3>
          {[["COD", true], ["Momo", true], ["VNPay", true], ["ZaloPay", false]].map(([name, active]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{name as string}</span>
              <button className={`rounded-full px-3 py-1 text-xs transition ${active ? "bg-green-900/50 text-green-400" : "bg-sidebar-accent text-muted-foreground"}`}>{active ? "Báº­t" : "Táº¯t"}</button>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">ThÃ´ng bÃ¡o</h3>
          {["Email Ä‘Æ¡n hÃ ng má»›i", "SMS xÃ¡c nháº­n", "ThÃ´ng bÃ¡o háº¿t hÃ ng", "BÃ¡o cÃ¡o doanh thu hÃ ng ngÃ y"].map(n => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{n}</span>
              <button className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">Báº­t</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main AdminPanel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Sáº£n pháº©m", icon: Package },
  { key: "categories", label: "Danh má»¥c", icon: Tag },
  { key: "options", label: "TÃ¹y chá»n SP", icon: Settings },
  { key: "orders", label: "ÄÆ¡n hÃ ng", icon: ShoppingBag },
  { key: "users", label: "NgÆ°á»i dÃ¹ng", icon: Users },
  { key: "reviews", label: "ÄÃ¡nh giÃ¡", icon: Star },
  { key: "vouchers", label: "Voucher", icon: Tag },
  { key: "banners", label: "Banner", icon: Image },
  { key: "revenue", label: "Thá»‘ng kÃª", icon: BarChart2 },
  { key: "settings", label: "CÃ i Ä‘áº·t", icon: Settings },
];

export function AdminPanel({ onExit }: { onExit: () => void }) {
  const [active, setActive] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  const content: Record<string, React.ReactElement> = {
    dashboard: <Dashboard />,
    products: <AdminProducts />,
    categories: <AdminCategories />,
    options: <AdminOptions />,
    orders: <AdminOrders />,
    users: <AdminUsers />,
    reviews: <AdminReviews />,
    vouchers: <AdminVouchers />,
    banners: <AdminBanners />,
    revenue: <AdminRevenue />,
    settings: <AdminSettings />,
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Admin top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sidebar-accent bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setMobileNav(!mobileNav)}>
            <ChevronDown size={20} className={`transition ${mobileNav ? "rotate-180" : ""}`} />
          </button>
          <span className="font-serif text-lg font-bold text-primary">Sweet Bean Admin</span>
        </div>
        <button onClick={onExit} className="rounded-full bg-sidebar px-4 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
          â† Vá» website
        </button>
      </header>

      <div className="mx-auto grid max-w-screen-xl gap-0 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className={`${mobileNav ? "block" : "hidden"} lg:block bg-sidebar border-r border-sidebar-accent min-h-screen p-4`}>
          <nav className="space-y-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActive(key); setMobileNav(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active === key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-sidebar-accent"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="p-5 lg:p-7">
          {content[active]}
        </main>
      </div>
    </div>
  );
}

