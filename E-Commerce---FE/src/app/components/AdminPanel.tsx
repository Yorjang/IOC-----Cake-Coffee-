import { useState } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
const orders = [
  { id: "#SB1024", customer: "Nguyễn Minh Anh", items: "Bánh Tiramisu, Cafe Latte", total: "100.000đ", status: "Đang giao", time: "12:45" },
  { id: "#SB1023", customer: "Trần Thị Bình", items: "Bánh sinh nhật socola", total: "350.000đ", status: "Đang chuẩn bị", time: "12:10" },
  { id: "#SB1022", customer: "Lê Văn Cường", items: "Combo Tiramisu + Latte", total: "89.000đ", status: "Hoàn thành", time: "11:30" },
  { id: "#SB1021", customer: "Phạm Thu Hà", items: "Matcha Latte x2", total: "118.000đ", status: "Xác nhận", time: "11:00" },
  { id: "#SB1020", customer: "Vũ Đức Minh", items: "Bánh tart trứng x3", total: "75.000đ", status: "Huỷ", time: "10:15" },
  { id: "#SB1019", customer: "Đinh Lan Hương", items: "Bánh Red Velvet, Cold Brew", total: "115.000đ", status: "Hoàn thành", time: "09:40" },
];

const reviews = [
  { id: 1, product: "Bánh Tiramisu", user: "Nguyễn Minh Anh", rating: 5, comment: "Bánh ngon tuyệt, cream mịn, không ngọt quá. Giao hàng nhanh!", date: "20/06/2025", status: "Đã duyệt" },
  { id: 2, product: "Cafe Latte", user: "Trần Thị Bình", rating: 4, comment: "Cafe thơm, vị chuẩn ý. Sẽ order tiếp.", date: "19/06/2025", status: "Đã duyệt" },
  { id: 3, product: "Bánh mousse xoài", user: "Lê Văn Cường", rating: 3, comment: "Vị xoài nhạt hơn tôi mong đợi nhưng vẫn ổn.", date: "18/06/2025", status: "Chờ duyệt" },
  { id: 4, product: "Combo sinh nhật mini", user: "Phạm Thu Hà", rating: 5, comment: "Đặt tiệc sinh nhật cho con, mọi người khen nức nở!", date: "17/06/2025", status: "Chờ duyệt" },
  { id: 5, product: "Bánh tart trứng", user: "Vũ Đức Minh", rating: 2, comment: "Vỏ tart bị mềm do ship xa, mong shop cải thiện.", date: "16/06/2025", status: "Ẩn" },
];

const vouchers = [
  { code: "CAKE10", type: "Phần trăm", value: "10%", min: "0đ", used: 42, limit: 100, expiry: "31/07/2025", status: "Đang hoạt động" },
  { code: "COFFEE20", type: "Phần trăm", value: "20%", min: "50.000đ", used: 18, limit: 50, expiry: "30/06/2025", status: "Đang hoạt động" },
  { code: "COMBO15", type: "Phần trăm", value: "15%", min: "80.000đ", used: 9, limit: 30, expiry: "15/07/2025", status: "Đang hoạt động" },
  { code: "NEWUSER50", type: "Cố định", value: "50.000đ", min: "100.000đ", used: 5, limit: 20, expiry: "31/12/2025", status: "Đang hoạt động" },
  { code: "SUMMER30", type: "Phần trăm", value: "30%", min: "200.000đ", used: 30, limit: 30, expiry: "30/06/2025", status: "Hết lượt" },
];

const banners = [
  { id: 1, title: "Flash Sale 14:00 – Cafe giảm 20%", position: "Hero chính", status: "Hiển thị", start: "01/06/2025", end: "30/06/2025", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=180&h=80&fit=crop&auto=format" },
  { id: 2, title: "Combo sinh nhật mini từ 399.000đ", position: "Banner phục 1", status: "Hiển thị", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=180&h=80&fit=crop&auto=format" },
  { id: 3, title: "Matcha mới – Thử ngay!", position: "Banner phục 2", status: "Ẩn", start: "15/06/2025", end: "15/07/2025", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=180&h=80&fit=crop&auto=format" },
  { id: 4, title: "Voucher CAKE10 toàn bộ bánh", position: "Popup", status: "Hiển thị", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=180&h=80&fit=crop&auto=format" },
];

const options = [
  { id: 1, name: "Size", values: "S / M / L", applies: "Cafe, Trà, Đồ uống khác", type: "Size" },
  { id: 2, name: "Đường", values: "Ít / Bình thường / Nhiều", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
  { id: 3, name: "Đá", values: "Ít đá / Bình thường / Nhiều đá", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
  { id: 4, name: "Size bánh", values: "4 inch / 6 inch / 8 inch", applies: "Bánh sinh nhật, Bánh mousse", type: "Size" },
  { id: 5, name: "Lời chúc", values: "Nhập văn bản", applies: "Bánh sinh nhật", type: "Text" },
  { id: 6, name: "Topping", values: "Dâu / Việt quất / Kiwi / Không", applies: "Bánh tart, Bánh mousse", type: "Topping" },
];


const branches = [
  { id: "BR01", name: "Sweet Bean Quận 1", address: "123 Nguyễn Huệ, Quận 1, TP.HCM", phone: "0909 888 777", hours: "07:00 - 22:00", manager: "Phạm Thu Hà", status: "Hiển thị", lat: "10.7756", lng: "106.7019", orders: 26, revenue: "3.120.000đ" },
  { id: "BR02", name: "Sweet Bean Thảo Điền", address: "45 Xuân Thủy, Thủ Đức, TP.HCM", phone: "0912 444 555", hours: "07:30 - 21:30", manager: "Lê Văn Cường", status: "Hiển thị", lat: "10.8021", lng: "106.7334", orders: 18, revenue: "2.480.000đ" },
  { id: "BR03", name: "Sweet Bean Phú Nhuận", address: "88 Phan Xích Long, Phú Nhuận, TP.HCM", phone: "0933 222 111", hours: "08:00 - 22:00", manager: "Trần Thị Bình", status: "Ẩn", lat: "10.7990", lng: "106.6857", orders: 11, revenue: "1.560.000đ" },
];

const inventoryRows = [
  { branch: "Quận 1", variant: "Tiramisu lát", sku: "CK-TIR-M", qty: 24, min: 10, expiry: "28/06/2025", status: "Đủ hàng" },
  { branch: "Quận 1", variant: "Mousse xoài 6 inch", sku: "CK-MGX-6", qty: 4, min: 8, expiry: "26/06/2025", status: "Sắp hết" },
  { branch: "Thảo Điền", variant: "Cafe Latte M", sku: "CF-LAT-M", qty: 120, min: 40, expiry: "-", status: "Đủ hàng" },
  { branch: "Phú Nhuận", variant: "Bánh tart trứng", sku: "CK-TART-E", qty: 0, min: 12, expiry: "25/06/2025", status: "Hết hàng" },
];

const posInvoices = [
  { id: "#POS2048", branch: "Quan 1", cashier: "Minh Anh", items: "Latte M x2, Tiramisu x1", total: "155.000d", pay: "Momo", time: "14:20" },
  { id: "#POS2047", branch: "Thao Dien", cashier: "Duc Minh", items: "Cold Brew x1, Cookie x2", total: "140.000d", pay: "Tien mat", time: "13:55" },
  { id: "#POS2046", branch: "Quan 1", cashier: "Lan Huong", items: "Combo Tiramisu + Latte", total: "89.000d", pay: "VNPay", time: "13:10" },
];

const cakeRequests = [
  { id: "#CK908", customer: "Nguyen Minh Anh", branch: "Quan 1", design: "Sinh nhat socola 8 inch", due: "25/06 18:00", note: "Ghi chu Happy Birthday Bin", status: "Dang chuan bi" },
  { id: "#CK907", customer: "Tran Thi Binh", branch: "Thao Dien", design: "Banh kem dau 6 inch", due: "25/06 16:30", note: "Tone hong, them nen so 5", status: "Xac nhan" },
  { id: "#CK906", customer: "Le Van Cuong", branch: "Phu Nhuan", design: "Mousse xoai mini", due: "26/06 10:00", note: "Nhan tai cua hang", status: "Hoan thanh" },
];
const statusColor: Record<string, string> = {
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Hoàn thành": "bg-green-100 text-green-700",
  "Xác nhận": "bg-purple-100 text-purple-700",
  "Huỷ": "bg-red-100 text-red-700",
  "Đang bán": "bg-green-100 text-green-700",
  "Hết hàng": "bg-red-100 text-red-700",
  "Đặt trước": "bg-yellow-100 text-yellow-700",
  "Hoạt động": "bg-green-100 text-green-700",
  "VIP": "bg-amber-100 text-amber-700",
  "Mới": "bg-blue-100 text-blue-700",
  "Đã duyệt": "bg-green-100 text-green-700",
  "Chờ duyệt": "bg-yellow-100 text-yellow-700",
  "Ẩn": "bg-gray-100 text-gray-700",
  "Đang hoạt động": "bg-green-100 text-green-700",
  "Hết lượt": "bg-red-100 text-red-700",
  "Hiển thị": "bg-green-100 text-green-700",
  "Đủ hàng": "bg-green-100 text-green-700",
  "Sắp hết": "bg-yellow-100 text-yellow-700",
};

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

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const stats = [
    { label: "Doanh thu hôm nay", value: "4.820.000đ", delta: "+12%", icon: DollarSign },
    { label: "Tổng đơn hàng", value: "42", delta: "+8 hôm nay", icon: ShoppingBag },
    { label: "Sản phẩm", value: "128", delta: "3 sắp hết", icon: Package },
    { label: "Khách hàng mới", value: "7", delta: "+2 so hôm qua", icon: Users },
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
       <span className="text-sm text-muted-foreground">Cập nhật: 24/06/2025 — 14:32</span>
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
                 <p className="text-xs text-muted-foreground">{o.time} — {o.items.slice(0, 22)}…</p>
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

// ── Products ──────────────────────────────────────────────────────────────────
function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", description: "", imageUrl: "", productType: "cake", price: "45000" });

  const getToken = () => localStorage.getItem("accessToken");

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${env.API_URL}/products`),
        fetch(`${env.API_URL}/products/categories`),
      ]);
      if (pRes.ok) setItems(await pRes.json());
      if (cRes.ok) setCats(await cRes.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", categoryId: cats[0]?.id ?? "", description: "", imageUrl: "", productType: "cake", price: "45000" }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, categoryId: p.categoryId, description: p.description || "", imageUrl: p.imageUrl || "", productType: p.productType, price: p.variants?.[0]?.price?.toString() || "45000" }); setShowModal(true); };

  const save = async () => {
    const token = getToken();
    if (!token) return;
    const url = editing ? `${env.API_URL}/products/${editing.id}` : `${env.API_URL}/products`;
    const method = editing ? "PATCH" : "POST";
    const body: any = { name: form.name, categoryId: form.categoryId, description: form.description, imageUrl: form.imageUrl, productType: form.productType };
    if (!editing) {
      body.variants = [{ sku: form.name.toUpperCase().replace(/\s+/g, "-") + "-DEFAULT", variantName: `${form.name} - Mặc định`, size: "Mặc định", price: parseInt(form.price) || 45000 }];
    }
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi lưu sản phẩm"); }
  };

  const remove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      const res = await fetch(`${env.API_URL}/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi xóa sản phẩm"); }
  };

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const fmtPrice = (p: any) => { const v = p.variants?.[0]; return v ? `${Number(v.price).toLocaleString("vi-VN")}đ` : "-"; };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý sản phẩm</h2>
        <AdminBtn onClick={openAdd}><span className="flex items-center gap-1"><Plus size={14} />Thêm sản phẩm</span></AdminBtn>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground" placeholder="Tìm sản phẩm…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      {loading ? <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div> : (
        <div className="overflow-auto rounded-2xl bg-sidebar">
          <table className="w-full text-sm">
            <TableHeader cols={["Sản phẩm", "Danh mục", "Giá", "Biến thể", "Loại", "Thao tác"]} />
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="size-10 rounded-lg object-cover" />}
                      <span className="text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{p.category?.name ?? "-"}</td>
                  <td className="py-3 font-semibold text-primary">{fmtPrice(p)}</td>
                  <td className="py-3 text-muted-foreground">{p.variants?.length ?? 0}</td>
                  <td className="py-3"><span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs text-primary">{p.productType}</span></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <AdminBtn variant="ghost" onClick={() => openEdit(p)}><Edit size={14} /></AdminBtn>
                      <AdminBtn variant="danger" onClick={() => remove(p.id)}><Trash2 size={14} /></AdminBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
            <div className="space-y-3">
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">-- Chọn danh mục --</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}>
                <option value="cake">Bánh (cake)</option><option value="coffee">Cafe (coffee)</option><option value="drink">Đồ uống (drink)</option><option value="combo">Combo</option>
              </select>
              <textarea className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none resize-none" rows={2} placeholder="Mô tả sản phẩm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="URL ảnh sản phẩm" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
              {!editing && <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Giá bán mặc định (VNĐ)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <AdminBtn variant="ghost" onClick={() => setShowModal(false)}>Hủy</AdminBtn>
              <AdminBtn onClick={save}>{editing ? "Cập nhật" : "Tạo sản phẩm"}</AdminBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function AdminCategories() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });

  const getToken = () => localStorage.getItem("accessToken");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/products/categories`);
      if (res.ok) setItems(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "", imageUrl: "" }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, description: c.description || "", imageUrl: c.imageUrl || "" }); setShowModal(true); };

  const save = async () => {
    const token = getToken();
    if (!token) return;
    const url = editing ? `${env.API_URL}/products/categories/${editing.id}` : `${env.API_URL}/products/categories`;
    const method = editing ? "PATCH" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi lưu danh mục"); }
  };

  const remove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm("Xóa danh mục này?")) return;
    try {
      const res = await fetch(`${env.API_URL}/products/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi xóa danh mục"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý danh mục</h2>
        <AdminBtn onClick={openAdd}><span className="flex items-center gap-1"><Plus size={14} />Thêm danh mục</span></AdminBtn>
      </div>
      {loading ? <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div> : (
        <div className="overflow-auto rounded-2xl bg-sidebar">
          <table className="w-full text-sm">
            <TableHeader cols={["Tên danh mục", "Slug", "Mô tả", "Trạng thái", "Thao tác"]} />
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-medium text-foreground">{c.name}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">{c.description || "-"}</td>
                  <td className="py-3"><StatusBadge status={c.isActive ? "Hiển thị" : "Ẩn"} /></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <AdminBtn variant="ghost" onClick={() => openEdit(c)}><Edit size={14} /></AdminBtn>
                      <AdminBtn variant="danger" onClick={() => remove(c.id)}><Trash2 size={14} /></AdminBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{items.length} danh mục</p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? "Sửa danh mục" : "Thêm danh mục mới"}</h3>
            <div className="space-y-3">
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Tên danh mục" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <textarea className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none resize-none" rows={2} placeholder="Mô tả danh mục" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="URL ảnh danh mục" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <AdminBtn variant="ghost" onClick={() => setShowModal(false)}>Hủy</AdminBtn>
              <AdminBtn onClick={save}>{editing ? "Cập nhật" : "Tạo danh mục"}</AdminBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Options ───────────────────────────────────────────────────────────────────
function AdminOptions() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý tùy chọn sản phẩm</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm tùy chọn</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["#", "Tên tùy chọn", "Kiểu", "Giá trị", "Áp dụng cho", "Thao tác"]} />
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
        <h3 className="mb-4 text-sm font-semibold text-foreground">Thêm tùy chọn mới</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Tên tùy chọn" />
          <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Kiểu: Size</option><option>Tùy chỉnh</option><option>Topping</option><option>Text</option></select>
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Giá trị (ngăn cách bằng /)" />
          <AdminBtn>Lưu tùy chọn</AdminBtn>
        </div>
      </div>
    </div>
  );
}

// ── Branches ─────────────────────────────────────────────────────────────────
function AdminBranches() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi thông tin cửa hàng, giờ mở cửa, quản lý và trạng thái hiển thị.</p>
        </div>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm chi nhánh</span></AdminBtn>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {branches.map(branch => (
          <div key={branch.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-primary">{branch.id}</p>
                <h3 className="mt-1 font-semibold text-foreground">{branch.name}</h3>
              </div>
              <StatusBadge status={branch.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" />{branch.address}</p>
              <p className="flex gap-2"><Clock size={15} className="mt-0.5 shrink-0 text-primary" />{branch.hours}</p>
              <p className="flex gap-2"><Users size={15} className="mt-0.5 shrink-0 text-primary" />Quản lý: {branch.manager}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-sidebar-accent p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Đơn hôm nay</p>
                <p className="mt-1 font-semibold text-foreground">{branch.orders}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doanh thu</p>
                <p className="mt-1 font-semibold text-primary">{branch.revenue}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <AdminBtn variant="ghost"><Eye size={14} /></AdminBtn>
              <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
              <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-sidebar p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Cấu hình chi nhánh mới</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Tên chi nhánh" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Số điện thoại" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground lg:col-span-2" placeholder="Địa chỉ" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Giờ mở cửa" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Quản lý chi nhánh" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Latitude" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Longitude" />
        </div>
        <div className="mt-4"><AdminBtn>Lưu chi nhánh</AdminBtn></div>
      </div>
    </div>
  );
}

function AdminStoreMap() {
  const activeBranch = branches[0];
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(activeBranch.address)}&output=embed`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Bản đồ cửa hàng</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kiểm tra vị trí, bán kính phục vụ và thông tin chỉ đường của từng chi nhánh.</p>
        </div>
        <AdminBtn variant="ghost"><span className="flex items-center gap-1"><ArrowUpRight size={14} />Mở Google Maps</span></AdminBtn>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          {branches.map(branch => (
            <button key={branch.id} className={`w-full rounded-2xl border p-4 text-left transition ${branch.id === activeBranch.id ? "border-primary bg-sidebar" : "border-sidebar-accent bg-sidebar hover:bg-sidebar-accent"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{branch.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{branch.address}</p>
                </div>
                <StatusBadge status={branch.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{branch.hours}</span>
                <span>{branch.phone}</span>
              </div>
            </button>
          ))}
        </aside>

        <section className="overflow-hidden rounded-2xl bg-sidebar">
          <div className="h-[420px] bg-sidebar-accent">
            <iframe
              title="Bản đồ chi nhánh Sweet Bean"
              src={mapSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              ["Bán kính giao", "8 km", "Áp dụng nội thành"],
              ["Thời gian dự kiến", "35-60 phút", "Tuỳ khung giờ cao điểm"],
              ["Chi nhánh hoạt động", "2/3", "1 chi nhánh đang ẩn"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl bg-sidebar-accent p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminInventory() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tồn kho theo chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cảnh báo sắp hết, hết hàng và sản phẩm gần hạn để nhân viên xử lý kịp thời.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminBtn variant="ghost"><span className="flex items-center gap-1"><Filter size={14} />Lọc</span></AdminBtn>
          <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Tạo phiếu chuyển</span></AdminBtn>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Tổng SKU", "248", "3 chi nhánh"],
          ["Sắp hết hàng", "7", "Cần nhập trong hôm nay"],
          ["Hết hàng", "2", "Ẩn khỏi menu online"],
        ].map(([label, value, sub], index) => (
          <div key={label} className="rounded-2xl bg-sidebar p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Boxes size={17} className={index === 0 ? "text-primary" : index === 1 ? "text-yellow-400" : "text-red-400"} />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Chi nhánh", "Biến thể", "SKU", "Tồn", "Tối thiểu", "Hạn dùng", "Trạng thái", "Thao tác"]} />
          <tbody>
            {inventoryRows.map(row => (
              <tr key={`${row.branch}-${row.sku}`} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-medium text-foreground">{row.branch}</td>
                <td className="py-3 text-muted-foreground">{row.variant}</td>
                <td className="py-3 font-mono text-xs text-primary">{row.sku}</td>
                <td className="py-3 font-semibold text-foreground">{row.qty}</td>
                <td className="py-3 text-muted-foreground">{row.min}</td>
                <td className="py-3 text-muted-foreground">{row.expiry}</td>
                <td className="py-3"><StatusBadge status={row.status} /></td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="ghost"><ArrowUpRight size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="font-semibold text-foreground">Cảnh báo ưu tiên</h3>
          <div className="mt-4 space-y-3">
            {inventoryRows.filter(row => row.status !== "Đủ hàng").map(row => (
              <div key={row.sku} className="flex items-center justify-between rounded-xl bg-sidebar-accent p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{row.variant}</p>
                  <p className="text-xs text-muted-foreground">{row.branch} · còn {row.qty}/{row.min}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-sidebar p-5">
          <h3 className="font-semibold text-foreground">Phiếu chuyển kho nhanh</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Từ: Quận 1</option><option>Thảo Điền</option><option>Phú Nhuận</option></select>
            <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Đến: Phú Nhuận</option><option>Quận 1</option><option>Thảo Điền</option></select>
            <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="SKU / tên sản phẩm" />
            <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Số lượng" />
          </div>
          <div className="mt-4"><AdminBtn>Tạo phiếu chuyển</AdminBtn></div>
        </div>
      </div>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [filter, setFilter] = useState("Tất cả");
  const tabs = ["Tất cả", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành", "Huỷ"];
  const filtered = filter === "Tất cả" ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-40" placeholder="Tìm đơn #SB…" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1.5 text-sm transition ${filter === t ? "bg-primary text-primary-foreground" : "bg-sidebar text-muted-foreground hover:bg-sidebar-accent"}`}>{t}</button>
        ))}
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã đơn", "Khách hàng", "Sản phẩm", "Tổng tiền", "Giờ", "Trạng thái", "Thao tác"]} />
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
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Không có đơn hàng nào trong trạng thái này.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function AdminUsers() {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const getToken = () => localStorage.getItem("accessToken");

  const loadUsers = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để quản lý người dùng.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tải danh sách người dùng.");
      setAdminUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = adminUsers.filter(user => {
    const keyword = search.toLowerCase();
    return [user.fullName, user.email, user.phone, user.role]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(keyword));
  });

  const saveUser = async () => {
    if (!editingUser) return;
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để sửa người dùng.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          email: editingUser.email || null,
          phone: editingUser.phone || null,
          role: editingUser.role,
          isActive: editingUser.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể cập nhật người dùng.");

      setAdminUsers(prev => prev.map(user => user.id === data.id ? data : user));
      setEditingUser(null);
      toast.success("Đã cập nhật người dùng.");
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật người dùng.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: any) => {
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để xóa người dùng.");
      return;
    }
    if (!window.confirm(`Xóa người dùng ${user.fullName || user.email}?`)) return;

    try {
      const res = await fetch(`${env.API_URL}/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể xóa người dùng.");

      setAdminUsers(prev => prev.filter(item => item.id !== user.id));
      toast.success("Đã xóa người dùng.");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa người dùng.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý người dùng</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadUsers} className="rounded-xl bg-sidebar px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-44" placeholder="Tìm tên, email…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Họ tên", "Email", "SĐT", "Vai trò", "Trạng thái", "Tham gia", "Thao tác"]} />
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-medium text-foreground">{u.fullName}</td>
                <td className="py-3 text-muted-foreground">{u.email || "-"}</td>
                <td className="py-3 text-muted-foreground">{u.phone || "-"}</td>
                <td className="py-3"><span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{u.role}</span></td>
                <td className="py-3"><StatusBadge status={u.isActive ? "Hoạt động" : "Ẩn"} /></td>
                <td className="py-3 text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost" onClick={() => setEditingUser({ ...u })}><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger" onClick={() => deleteUser(u)}><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Không có người dùng nào.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Đang tải danh sách người dùng...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-sidebar-accent bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Sửa người dùng</h3>
                <p className="mt-1 text-sm text-muted-foreground">Cập nhật họ tên, email, số điện thoại và quyền truy cập.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="rounded-full bg-sidebar px-3 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent">Đóng</button>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Họ tên</span>
                <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.fullName || ""} onChange={e => setEditingUser((prev: any) => ({ ...prev, fullName: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Email</span>
                <input type="email" className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.email || ""} onChange={e => setEditingUser((prev: any) => ({ ...prev, email: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Số điện thoại</span>
                <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.phone || ""} onChange={e => setEditingUser((prev: any) => ({ ...prev, phone: e.target.value }))} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Vai trò</span>
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.role || "customer"} onChange={e => setEditingUser((prev: any) => ({ ...prev, role: e.target.value }))}>
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="cashier">cashier</option>
                    <option value="store_manager">store_manager</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.isActive ? "active" : "inactive"} onChange={e => setEditingUser((prev: any) => ({ ...prev, isActive: e.target.value === "active" }))}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Khóa</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar">Hủy</button>
              <button onClick={saveUser} disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function AdminReviews() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đánh giá</h2>
        <div className="flex gap-2">
          <span className="rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">2 chờ duyệt</span>
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
                    <p className="text-xs text-muted-foreground">{r.date} · {r.product}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? "fill-sidebar-primary text-sidebar-primary" : "text-sidebar-accent"}/>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                <div className="flex gap-2 mt-1">
                  {r.status === "Chờ duyệt" && <AdminBtn><CheckCircle size={14} /></AdminBtn>}
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

// ── Vouchers ──────────────────────────────────────────────────────────────────
function AdminVouchers() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý voucher</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Tạo voucher</span></AdminBtn>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã", "Kiểu", "Giá trị", "Đơn tối thiểu", "Đã dùng", "Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
          <tbody>
            {vouchers.map(v => (
              <tr key={v.code} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                <td className="py-3 text-muted-foreground">{v.type}</td>
                <td className="py-3 font-semibold text-foreground">{v.value}</td>
                <td className="py-3 text-muted-foreground">{v.min}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-sidebar-accent">
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
        <h3 className="mb-4 text-sm font-semibold text-foreground">Tạo voucher mới</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Mã voucher (VD: SUMMER30)" />
          <select className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none"><option>Loại: Phần trăm (%)</option><option>Cố định (đ)</option></select>
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Giá trị (VD: 20)" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Đơn tối thiểu (đ)" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Giới hạn lượt dùng" />
          <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" type="date" />
          <div className="sm:col-span-2 lg:col-span-1">
            <AdminBtn>Tạo voucher</AdminBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Banners ───────────────────────────────────────────────────────────────────
function AdminBanners() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý banner</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm banner</span></AdminBtn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map(b => (
          <div key={b.id} className="rounded-2xl bg-sidebar overflow-hidden transition hover:bg-sidebar-accent">
            <img src={b.img} alt={b.title} className="h-28 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{b.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.position} · {b.start} → {b.end}</p>
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
        <p className="text-sm text-muted-foreground">Kéo thả hoặc <span className="text-primary cursor-pointer">chọn ảnh</span> để tạo banner mới</p>
      </div>
    </div>
  );
}

// ── Revenue ───────────────────────────────────────────────────────────────────
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
    { name: "Combo Tiramisu + Latte", revenue: "8.900.000đ", units: 100 },
    { name: "Bánh sinh nhật socola", revenue: "7.000.000đ", units: 20 },
    { name: "Cafe Latte", revenue: "6.600.000đ", units: 120 },
    { name: "Matcha Latte", revenue: "4.720.000đ", units: 80 },
    { name: "Combo sinh nhật mini", revenue: "3.990.000đ", units: 10 },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Thống kê doanh thu</h2>
        <select className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none"><option>6 tháng gần nhất</option><option>12 tháng</option><option>Năm 2025</option></select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Tổng doanh thu", "316.000.000đ", "+18% so tháng trước"], ["Tổng đơn hàng", "2.420", "+24 đơn hôm nay"], ["Giá trị trung bình", "130.578đ", "mỗi đơn hàng"]].map(([l, v, s]) => (
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

// ── Settings ──────────────────────────────────────────────────────────────────
function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Cài đặt hệ thống</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông tin cửa hàng</h3>
          {["Tên cửa hàng", "Email liên hệ", "Số điện thoại", "Địa chỉ"].map((label, i) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={["Sweet Bean Coffee & Cake", "hello@sweetbean.vn", "0909 888 777", "123 Nguyễn Huệ, Q1, TP.HCM"][i]} />
            </div>
          ))}
          <AdminBtn>Lưu thay đổi</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cấu hình giao hàng</h3>
          {[["Phí giao hàng cơ bản", "25.000đ"], ["Miễn phí từ", "200.000đ"], ["Bán kính giao (km)", "15"], ["Thời gian giao (phút)", "45-90"]].map(([l, v]) => (
            <div key={l}>
              <label className="mb-1 block text-xs text-muted-foreground">{l}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={v} />
            </div>
          ))}
          <AdminBtn>Lưu cấu hình</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cổng thanh toán</h3>
          {[["COD", true], ["Momo", true], ["VNPay", true], ["ZaloPay", false]].map(([name, active]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{name as string}</span>
              <button className={`rounded-full px-3 py-1 text-xs transition ${active ? "bg-green-900/50 text-green-400" : "bg-sidebar-accent text-muted-foreground"}`}>{active ? "Bật" : "Tắt"}</button>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông báo</h3>
          {["Email đơn hàng mới", "SMS xác nhận", "Thông báo hết hàng", "Báo cáo doanh thu hàng ngày"].map(n => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{n}</span>
              <button className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">Bật</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
type AdminRole = "admin" | "store_manager" | "staff" | "cashier";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Quản trị viên",
  store_manager: "Quản lý cửa hàng",
  staff: "Nhân viên",
  cashier: "Thu ngân",
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBag, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "branches", label: "Chi nhánh", icon: Store, allowedRoles: ["admin", "store_manager"] },
  { key: "storeMap", label: "Bản đồ", icon: MapPin, allowedRoles: ["admin", "store_manager"] },
  { key: "products", label: "Sản phẩm", icon: Package, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "categories", label: "Danh mục", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "options", label: "Tùy chọn SP", icon: Settings, allowedRoles: ["admin", "store_manager"] },
  { key: "inventory", label: "Tồn kho", icon: Boxes, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "users", label: "Người dùng", icon: Users, allowedRoles: ["admin"] },
  { key: "reviews", label: "Đánh giá", icon: Star, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "vouchers", label: "Voucher", icon: Tag, allowedRoles: ["admin", "store_manager"] },
  { key: "banners", label: "Banner", icon: Image, allowedRoles: ["admin", "store_manager"] },
  { key: "revenue", label: "Thống kê", icon: BarChart2, allowedRoles: ["admin", "store_manager"] },
  { key: "settings", label: "Cài đặt", icon: Settings, allowedRoles: ["admin"] },
] satisfies Array<{
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  allowedRoles: AdminRole[];
}>;

export function AdminPanel({ onExit, adminUser }: { onExit: () => void; adminUser?: any }) {
  const role = (adminUser?.role ?? "admin") as AdminRole;
  const visibleNav = navItems.filter(item => item.allowedRoles.includes(role));
  const [active, setActive] = useState(visibleNav[0]?.key ?? "dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  const content: Record<string, any> = {
    dashboard: <Dashboard />,
    orders: <AdminOrders />,
    branches: <AdminBranches />,
    storeMap: <AdminStoreMap />,
    products: <AdminProducts />,
    categories: <AdminCategories />,
    options: <AdminOptions />,
    inventory: <AdminInventory />,
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
          {adminUser && (
            <span className="hidden sm:flex items-center gap-2 rounded-full border border-sidebar-accent bg-sidebar/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-400" />
              {adminUser.fullName || adminUser.email}
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">{ROLE_LABEL[role] ?? role}</span>
            </span>
          )}
        </div>
        <button onClick={onExit} className="rounded-full bg-sidebar px-4 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
          Đăng xuất
        </button>
      </header>

      <div className="mx-auto grid max-w-screen-xl gap-0 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className={`${mobileNav ? "block" : "hidden"} lg:flex lg:flex-col bg-sidebar border-r border-sidebar-accent min-h-screen p-4`}>
          <nav className="flex-1 space-y-1">
            {visibleNav.map(({ key, label, icon: Icon }) => (
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
          <div className="mt-6 rounded-xl border border-sidebar-accent bg-background/40 p-3">
            <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Vai trò</p>
            <p className="text-xs font-semibold text-foreground">{ROLE_LABEL[role] ?? role}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {role === "admin" && "Toàn quyền quản lý hệ thống."}
              {role === "store_manager" && "Quản lý vận hành, sản phẩm, kho và doanh thu."}
              {role === "staff" && "Xử lý sản phẩm, tồn kho, đơn hàng và đánh giá."}
              {role === "cashier" && "Theo dõi dashboard và xử lý đơn hàng."}
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="p-5 lg:p-7">
          {content[active]}
        </main>
      </div>
    </div>
  );
}
