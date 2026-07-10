import { useState } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { supabase } from "../../config/supabase";

function ImageUploader({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file tối đa là 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Tải ảnh lên thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh lên thất bại. Vui lòng kiểm tra VITE_SUPABASE_ANON_KEY.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground block">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-12 rounded-xl border border-sidebar-accent overflow-hidden shrink-0">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-0 bg-black/60 grid place-items-center opacity-0 hover:opacity-100 transition text-[10px] text-white font-semibold"
            >
              Xóa
            </button>
          </div>
        ) : (
          <label className="flex size-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-accent bg-sidebar-accent/50 text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground transition shrink-0">
            {uploading ? (
              <Loader2 className="animate-spin text-primary" size={16} />
            ) : (
              <UploadCloud size={16} />
            )}
            <span className="text-[9px] mt-0.5 font-semibold">{uploading ? "Đang tải" : "Chọn file"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
        <div className="flex-1">
          <input
            className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-xs text-foreground outline-none border border-sidebar-accent placeholder:text-muted-foreground"
            placeholder="Hoặc nhập liên kết URL ảnh..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}

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
  "Tạm đóng": "bg-yellow-100 text-yellow-700",
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
    : "border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary-foreground";
  return <button onClick={onClick} className={`inline-flex min-h-8 min-w-10 items-center justify-center rounded-lg px-3 py-1.5 text-sm transition ${cls}`}>{children}</button>;
}

function TableHeader({ cols }: { cols: string[] }) {
  return <thead><tr className="border-b border-sidebar-accent">{cols.map(c => <th key={c} className="pb-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{c}</th>)}</tr></thead>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
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
              <ImageUploader label="Hình ảnh sản phẩm" value={form.imageUrl} onChange={url => setForm({ ...form, imageUrl: url })} />
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
              <ImageUploader label="Hình ảnh danh mục" value={form.imageUrl} onChange={url => setForm({ ...form, imageUrl: url })} />
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
  const localOptions = [
    { id: 1, name: "Size", values: "S / M / L", applies: "Cafe, Trà, Đồ uống khác", type: "Size" },
    { id: 2, name: "Đường", values: "Ít / Bình thường / Nhiều", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
    { id: 3, name: "Đá", values: "Ít đá / Bình thường / Nhiều đá", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
    { id: 4, name: "Size bánh", values: "4 inch / 6 inch / 8 inch", applies: "Bánh sinh nhật, Bánh mousse", type: "Size" },
    { id: 5, name: "Lời chúc", values: "Nhập văn bản", applies: "Bánh sinh nhật", type: "Text" },
    { id: 6, name: "Topping", values: "Dâu / Việt quất / Kiwi / Không", applies: "Bánh tart, Bánh mousse", type: "Topping" },
  ];

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
            {localOptions.map(o => (
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
  const [branchRows, setBranchRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branchForm, setBranchForm] = useState<any>(null);

  const getToken = () => localStorage.getItem("accessToken");
  const statusLabel = (status: string) => ({
    active: "Hiển thị",
    inactive: "Ẩn",
    temporarily_closed: "Tạm đóng",
  }[status] || status);

  const emptyBranchForm = () => ({
    name: "",
    address: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    status: "active",
    isActive: true,
  });

  const loadBranches = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để quản lý chi nhánh.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tải danh sách chi nhánh.");
      setBranchRows(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách chi nhánh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const saveBranch = async () => {
    if (!branchForm) return;
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để lưu chi nhánh.");
      return;
    }

    const payload = {
      name: String(branchForm.name || "").trim(),
      address: String(branchForm.address || "").trim(),
      phone: String(branchForm.phone || "").replace(/\s+/g, "") || null,
      email: String(branchForm.email || "").trim() || null,
      latitude: String(branchForm.latitude || "").trim() || null,
      longitude: String(branchForm.longitude || "").trim() || null,
      status: branchForm.status || "active",
      isActive: branchForm.status === "active",
    };

    if (!payload.name) {
      toast.error("Vui lòng nhập tên chi nhánh.");
      return;
    }
    if (!payload.address) {
      toast.error("Vui lòng nhập địa chỉ chi nhánh.");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!branchForm.id;
      const res = await fetch(`${env.API_URL}/branches${isEditing ? `/${branchForm.id}` : ""}`, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể lưu chi nhánh.");

      setBranchRows(prev => isEditing ? prev.map(branch => branch.id === data.id ? data : branch) : [data, ...prev]);
      setBranchForm(null);
      toast.success(isEditing ? "Đã cập nhật chi nhánh." : "Đã thêm chi nhánh.");
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu chi nhánh.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (branch: any) => {
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để xóa chi nhánh.");
      return;
    }
    if (!window.confirm(`Xóa chi nhánh ${branch.name}?`)) return;

    try {
      const res = await fetch(`${env.API_URL}/branches/${branch.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể xóa chi nhánh.");
      setBranchRows(prev => prev.filter(item => item.id !== branch.id));
      toast.success("Đã xóa chi nhánh.");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa chi nhánh.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi thông tin cửa hàng, giờ mở cửa, quản lý và trạng thái hiển thị.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadBranches} className="rounded-xl bg-sidebar px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
          <AdminBtn onClick={() => setBranchForm(emptyBranchForm())}><span className="flex items-center gap-1"><Plus size={14} />Thêm chi nhánh</span></AdminBtn>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {branchRows.map(branch => (
          <div key={branch.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-primary">{branch.id.slice(0, 8)}</p>
                <h3 className="mt-1 font-semibold text-foreground">{branch.name}</h3>
              </div>
              <StatusBadge status={statusLabel(branch.status)} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" />{branch.address}</p>
              <p className="flex gap-2"><Clock size={15} className="mt-0.5 shrink-0 text-primary" />{branch.phone || "Chưa có số điện thoại"}</p>
              <p className="flex gap-2"><Users size={15} className="mt-0.5 shrink-0 text-primary" />{branch.email || "Chưa có email"}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-sidebar-accent p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="mt-1 font-semibold text-foreground">{branch.latitude || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="mt-1 font-semibold text-primary">{branch.longitude || "-"}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <AdminBtn variant="ghost" onClick={() => setBranchForm({ ...branch })}><Edit size={14} /></AdminBtn>
              <AdminBtn variant="danger" onClick={() => deleteBranch(branch)}><Trash2 size={14} /></AdminBtn>
            </div>
          </div>
        ))}
        {!loading && branchRows.length === 0 && (
          <div className="rounded-2xl bg-sidebar p-8 text-center text-sm text-muted-foreground md:col-span-3">
            Chưa có chi nhánh nào trong database.
          </div>
        )}
      </div>

      {branchForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-sidebar-accent bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{branchForm.id ? "Sửa chi nhánh" : "Thêm chi nhánh"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Cập nhật thông tin cửa hàng, trạng thái hiển thị và tọa độ bản đồ.</p>
              </div>
              <button onClick={() => setBranchForm(null)} className="rounded-full bg-sidebar px-3 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent">Đóng</button>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Tên chi nhánh</span>
                <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.name || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, name: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Địa chỉ</span>
                <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.address || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, address: e.target.value }))} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Số điện thoại</span>
                  <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.phone || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, phone: e.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <input type="email" className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.email || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, email: e.target.value }))} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.status || "active"} onChange={e => setBranchForm((prev: any) => ({ ...prev, status: e.target.value, isActive: e.target.value === "active" }))}>
                    <option value="active">Hiển thị</option>
                    <option value="inactive">Ẩn</option>
                    <option value="temporarily_closed">Tạm đóng</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Latitude</span>
                  <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.latitude || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, latitude: e.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Longitude</span>
                  <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={branchForm.longitude || ""} onChange={e => setBranchForm((prev: any) => ({ ...prev, longitude: e.target.value }))} />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setBranchForm(null)} className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar">Hủy</button>
              <button onClick={saveBranch} disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu chi nhánh"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStoreMap() {
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBranchesList(data);
        if (data.length > 0) {
          setActiveBranchId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const activeBranch = branchesList.find(b => b.id === activeBranchId) || branchesList[0];
  const mapSrc = activeBranch
    ? `https://www.google.com/maps?q=${encodeURIComponent(activeBranch.address)}&output=embed`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Bản đồ cửa hàng</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kiểm tra vị trí, bán kính phục vụ và thông tin chỉ đường của từng chi nhánh.</p>
        </div>
        <AdminBtn variant="ghost" onClick={() => {
          if (activeBranch) {
            window.open(`https://www.google.com/maps?q=${encodeURIComponent(activeBranch.address)}`, "_blank");
          }
        }}><span className="flex items-center gap-1"><ArrowUpRight size={14} />Mở Google Maps</span></AdminBtn>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          {branchesList.map(branch => (
            <button
              key={branch.id}
              onClick={() => setActiveBranchId(branch.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${branch.id === activeBranchId ? "border-primary bg-sidebar" : "border-sidebar-accent bg-sidebar hover:bg-sidebar-accent"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{branch.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{branch.address}</p>
                </div>
                <StatusBadge status={branch.isActive ? "Hiển thị" : "Tạm đóng"} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>07:00 - 22:00</span>
                <span>{branch.phone || "N/A"}</span>
              </div>
            </button>
          ))}
          {branchesList.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center bg-sidebar rounded-2xl">Không tìm thấy chi nhánh nào.</p>
          )}
        </aside>

        {activeBranch ? (
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
                ["Trạng thái hoạt động", activeBranch.isActive ? "Đang chạy" : "Tạm dừng", "Cập nhật thời gian thực"],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-xl bg-sidebar-accent p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-bold text-primary">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="flex h-[420px] items-center justify-center bg-sidebar rounded-2xl text-muted-foreground">
            Chọn chi nhánh để xem bản đồ
          </div>
        )}
      </div>
    </div>
  );
}

function AdminInventory() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [formQuantity, setFormQuantity] = useState("");
  const [formMinQuantity, setFormMinQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const loadInventory = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleEdit = (stock: any) => {
    setEditingStock(stock);
    setFormQuantity(String(stock.quantity));
    setFormMinQuantity(String(stock.minQuantity));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("accessToken");
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/inventory/${editingStock.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: Number(formQuantity),
          minQuantity: Number(formMinQuantity),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Cập nhật tồn kho thành công.");
        setEditingStock(null);
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const totalSKU = stocks.length;
  const lowStock = stocks.filter(s => s.quantity <= s.minQuantity && s.quantity > 0).length;
  const outOfStock = stocks.filter(s => s.quantity === 0).length;

  const getStatus = (qty: number, min: number) => {
    if (qty === 0) return "Hết hàng";
    if (qty <= min) return "Sắp hết";
    return "Đủ hàng";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tồn kho theo chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cảnh báo sắp hết, hết hàng và sản phẩm gần hạn để nhân viên xử lý kịp thời.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Tổng SKU", String(totalSKU), `${new Set(stocks.map(s => s.branchId)).size} chi nhánh`],
          ["Sắp hết hàng", String(lowStock), "Cần nhập hàng sớm"],
          ["Hết hàng", String(outOfStock), "Ẩn khỏi menu bán hàng"],
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

      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Chi nhánh", "Biến thể", "SKU", "Tồn", "Tối thiểu", "Trạng thái", "Thao tác"]} />
          <tbody>
            {stocks.map(row => {
              const status = getStatus(row.quantity, row.minQuantity);
              return (
                <tr key={row.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-medium text-foreground">{row.branch?.name || "N/A"}</td>
                  <td className="py-3 text-muted-foreground">{row.variant?.product?.name} ({row.variant?.variantName || "Mặc định"})</td>
                  <td className="py-3 font-mono text-xs text-primary">{row.variant?.sku || "N/A"}</td>
                  <td className="py-3 font-semibold text-foreground">{row.quantity}</td>
                  <td className="py-3 text-muted-foreground">{row.minQuantity}</td>
                  <td className="py-3"><StatusBadge status={status} /></td>
                  <td className="py-3">
                    <AdminBtn variant="ghost" onClick={() => handleEdit(row)}><Edit size={14} /></AdminBtn>
                  </td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Không có dữ liệu tồn kho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-sidebar-accent bg-sidebar p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Điều chỉnh tồn kho</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Chi nhánh: {editingStock.branch?.name} - Biến thể: {editingStock.variant?.variantName}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Số lượng tồn kho</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formQuantity}
                  onChange={e => setFormQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Cảnh báo tối thiểu</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formMinQuantity}
                  onChange={e => setFormMinQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingStock(null)}
                className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrdersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái đơn hàng thành công.");
        loadOrders();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const mapDbToUiStatus = (status: string) => {
    if (status === 'pending' || status === 'confirmed') return 'Xác nhận';
    if (status === 'preparing') return 'Đang chuẩn bị';
    if (status === 'shipping') return 'Đang giao';
    if (status === 'completed') return 'Hoàn thành';
    if (status === 'cancelled') return 'Huỷ';
    return status;
  };

  const tabs = ["Tất cả", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành", "Huỷ"];

  const filtered = ordersList.filter(o => {
    const statusMatch = filter === "Tất cả" || mapDbToUiStatus(o.orderStatus) === filter;
    const searchMatch = !search ||
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.fullName || "").toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-40"
            placeholder="Tìm mã đơn / khách…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${filter === t ? "bg-primary text-primary-foreground font-semibold" : "bg-sidebar text-muted-foreground hover:bg-sidebar-accent"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã đơn", "Khách hàng", "Sản phẩm", "Tổng tiền", "Giờ", "Trạng thái", "Thao tác"]} />
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono text-xs text-primary">#{o.orderCode}</td>
                <td className="py-3 text-foreground">{o.user?.fullName || "Khách vãng lai"}</td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                  {o.items?.map((item: any) => `${item.quantity}x ${item.productName} (${item.variantName})`).join(', ') || "N/A"}
                </td>
                <td className="py-3 font-semibold text-foreground">{formatMoney(Number(o.totalAmount))}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3">
                  <select
                    value={o.orderStatus}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded bg-sidebar-accent px-2 py-1 text-xs text-foreground outline-none border border-sidebar-accent"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Xác nhận</option>
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="shipping">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Huỷ</option>
                  </select>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost" onClick={() => {
                      toast.info(`Hình thức: ${o.fulfillmentType === 'delivery' ? 'Giao hàng' : 'Nhận tại quầy'} · SĐT: ${o.user?.phone || 'N/A'}`);
                    }}><Eye size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  Không có đơn hàng nào khớp với bộ lọc.
                </td>
              </tr>
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
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState<any>(null);

  const getToken = () => localStorage.getItem("accessToken");
  const branchRoles = ["staff", "cashier", "store_manager"];
  const needsBranch = (role?: string) => branchRoles.includes(role || "");
  const branchName = (branchId?: string | null) => branches.find(branch => branch.id === branchId)?.name || "-";

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

  const loadBranches = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${env.API_URL}/branches/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tải danh sách chi nhánh.");
      setBranches(data);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách chi nhánh.");
    }
  };

  useEffect(() => {
    loadUsers();
    loadBranches();
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
          branchId: needsBranch(editingUser.role) ? editingUser.branchId : null,
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

  const openCreateUser = () => {
    setCreatingUser({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "customer",
      branchId: null,
      isActive: true,
    });
  };

  const createUser = async () => {
    if (!creatingUser) return;
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để cấp tài khoản.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: creatingUser.fullName,
          email: creatingUser.email || null,
          phone: creatingUser.phone || null,
          password: creatingUser.password,
          role: creatingUser.role,
          branchId: needsBranch(creatingUser.role) ? creatingUser.branchId : null,
          isActive: creatingUser.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể cấp tài khoản.");

      setAdminUsers(prev => [data, ...prev]);
      setCreatingUser(null);
      toast.success("Đã cấp tài khoản mới.");
    } catch (err: any) {
      toast.error(err.message || "Không thể cấp tài khoản.");
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
          <button onClick={openCreateUser} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition">
            Cấp tài khoản
          </button>
          <button onClick={loadUsers} className="rounded-xl bg-sidebar px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-44" placeholder="Tìm tên, email…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Họ tên", "Email", "SĐT", "Vai trò", "Chi nhánh", "Trạng thái", "Tham gia", "Thao tác"]} />
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-medium text-foreground">{u.fullName}</td>
                <td className="py-3 text-muted-foreground">{u.email || "-"}</td>
                <td className="py-3 text-muted-foreground">{u.phone || "-"}</td>
                <td className="py-3"><span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{u.role}</span></td>
                <td className="py-3 text-muted-foreground">{needsBranch(u.role) ? branchName(u.branchId) : "-"}</td>
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
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Không có người dùng nào.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Đang tải danh sách người dùng...</td></tr>
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
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.role || "customer"} onChange={e => setEditingUser((prev: any) => ({ ...prev, role: e.target.value, branchId: needsBranch(e.target.value) ? prev.branchId : null }))}>
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="cashier">cashier</option>
                    <option value="store_manager">store_manager</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                {needsBranch(editingUser.role) && (
                  <label className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">Chi nhánh</span>
                    <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={editingUser.branchId || ""} onChange={e => setEditingUser((prev: any) => ({ ...prev, branchId: e.target.value || null }))}>
                      <option value="">Chọn chi nhánh</option>
                      {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </label>
                )}
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

      {creatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-sidebar-accent bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Cấp tài khoản</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản cho khách hàng, nhân viên, thu ngân hoặc quản lý cửa hàng.</p>
              </div>
              <button onClick={() => setCreatingUser(null)} className="rounded-full bg-sidebar px-3 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent">Đóng</button>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Họ tên</span>
                <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.fullName || ""} onChange={e => setCreatingUser((prev: any) => ({ ...prev, fullName: e.target.value }))} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <input type="email" className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.email || ""} onChange={e => setCreatingUser((prev: any) => ({ ...prev, email: e.target.value }))} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Số điện thoại</span>
                  <input className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.phone || ""} onChange={e => setCreatingUser((prev: any) => ({ ...prev, phone: e.target.value }))} />
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Mật khẩu ban đầu</span>
                <input type="password" className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.password || ""} onChange={e => setCreatingUser((prev: any) => ({ ...prev, password: e.target.value }))} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Vai trò</span>
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.role || "customer"} onChange={e => setCreatingUser((prev: any) => ({ ...prev, role: e.target.value, branchId: needsBranch(e.target.value) ? prev.branchId : null }))}>
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="cashier">cashier</option>
                    <option value="store_manager">store_manager</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                {needsBranch(creatingUser.role) && (
                  <label className="grid gap-1 text-sm">
                    <span className="text-muted-foreground">Chi nhánh</span>
                    <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.branchId || ""} onChange={e => setCreatingUser((prev: any) => ({ ...prev, branchId: e.target.value || null }))}>
                      <option value="">Chọn chi nhánh</option>
                      {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <select className="rounded-xl bg-sidebar px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30" value={creatingUser.isActive ? "active" : "inactive"} onChange={e => setCreatingUser((prev: any) => ({ ...prev, isActive: e.target.value === "active" }))}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Khóa</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreatingUser(null)} className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar">Hủy</button>
              <button onClick={createUser} disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
                {saving ? "Đang tạo..." : "Tạo tài khoản"}
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
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReviewsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateVisibility = async (id: string, isVisible: boolean) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/reviews/${id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible }),
      });
      if (res.ok) {
        toast.success(isVisible ? "Đã hiển thị đánh giá." : "Đã ẩn đánh giá.");
        loadReviews();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa đánh giá thành công.");
        loadReviews();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pendingCount = reviewsList.filter(r => !r.isVisible).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đánh giá</h2>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">
              {pendingCount} đánh giá ẩn
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-4">
        {reviewsList.map(r => (
          <div key={r.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-primary text-xs font-bold">
                    {(r.user?.fullName || "K")[0]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.user?.fullName || "Khách hàng"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")} · {r.product?.name || "Sản phẩm"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-sidebar-accent"}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.isVisible ? "Đã duyệt" : "Ẩn"} />
                <div className="flex gap-2 mt-1">
                  {r.isVisible ? (
                    <button
                      title="Ẩn đánh giá"
                      onClick={() => updateVisibility(r.id, false)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-yellow-950/40 text-yellow-400 hover:bg-yellow-900/40 transition"
                    >
                      <XCircle size={14} />
                    </button>
                  ) : (
                    <button
                      title="Duyệt / Hiện đánh giá"
                      onClick={() => updateVisibility(r.id, true)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-green-950/40 text-green-400 hover:bg-green-900/40 transition"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    title="Xóa đánh giá"
                    onClick={() => deleteReview(r.id)}
                    className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {reviewsList.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12 bg-sidebar rounded-2xl">
            Không tìm thấy đánh giá nào.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Vouchers ──────────────────────────────────────────────────────────────────
function AdminVouchers() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiresAt) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          startsAt: new Date(), // Defaults to now
          expiresAt: new Date(expiresAt),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Tạo voucher thành công.");
        // Clear form
        setCode("");
        setDiscountValue("");
        setMinOrderValue("");
        setUsageLimit("");
        setExpiresAt("");
        loadCoupons();
      } else {
        toast.error(data.message || "Lỗi khi tạo voucher.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này không?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa voucher thành công.");
        loadCoupons();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý voucher</h2>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã", "Kiểu", "Giá trị", "Đơn tối thiểu", "Đã dùng / Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
          <tbody>
            {coupons.map(v => {
              const hasLimit = v.usageLimit !== null;
              const usedRatio = hasLimit ? (v.usedCount / v.usageLimit) * 100 : 0;
              const isExpired = new Date(v.expiresAt) < new Date();
              const status = isExpired ? "Hết hạn" : (v.isActive ? "Hoạt động" : "Tạm khóa");

              return (
                <tr key={v.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                  <td className="py-3 text-muted-foreground">
                    {v.discountType === "percent" ? "Phần trăm" : "Cố định"}
                  </td>
                  <td className="py-3 font-semibold text-foreground">
                    {v.discountType === "percent" ? `${v.discountValue}%` : formatMoney(Number(v.discountValue))}
                  </td>
                  <td className="py-3 text-muted-foreground">{formatMoney(Number(v.minOrderValue))}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-sidebar-accent overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(usedRatio, 100)}%` }} />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {v.usedCount}/{hasLimit ? v.usageLimit : "∞"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3"><StatusBadge status={status} /></td>
                  <td className="py-3">
                    <button
                      title="Xóa voucher"
                      onClick={() => handleDelete(v.id)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy voucher nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleCreate} className="rounded-2xl bg-sidebar p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Tạo voucher mới</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            required
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Mã voucher (VD: SUMMER30)"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={discountType}
            onChange={e => setDiscountType(e.target.value)}
          >
            <option value="percent">Loại: Phần trăm (%)</option>
            <option value="fixed">Cố định (đ)</option>
          </select>
          <input
            required
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Giá trị (VD: 20 hoặc 50000)"
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
          />
          <input
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Đơn tối thiểu (đ)"
            value={minOrderValue}
            onChange={e => setMinOrderValue(e.target.value)}
          />
          <input
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Giới hạn lượt dùng (để trống nếu vô hạn)"
            value={usageLimit}
            onChange={e => setUsageLimit(e.target.value)}
          />
          <input
            required
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition"
            >
              {saving ? "Đang tạo..." : "Tạo voucher"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Banners ───────────────────────────────────────────────────────────────────
function AdminBanners() {
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadBanners = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBannersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleToggleActive = async (banner: any) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/banners/${banner.id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái banner thành công.");
        loadBanners();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này không?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa banner thành công.");
        loadBanners();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      toast.error("Vui lòng nhập tên và link ảnh banner.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          imageUrl,
          linkUrl,
          sortOrder: Number(sortOrder),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Tạo banner thành công.");
        setTitle("");
        setImageUrl("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800");
        setLinkUrl("");
        setSortOrder("1");
        setShowAddForm(false);
        loadBanners();
      } else {
        toast.error(data.message || "Lỗi khi tạo banner.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý banner</h2>
        <AdminBtn onClick={() => setShowAddForm(!showAddForm)}>
          <span className="flex items-center gap-1">
            <Plus size={14} />
            {showAddForm ? "Hủy" : "Thêm banner"}
          </span>
        </AdminBtn>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Thêm banner mới</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              placeholder="Tên banner (VD: Banner mùa hè)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <div className="sm:col-span-2">
              <ImageUploader
                label="Hình ảnh banner"
                value={imageUrl}
                onChange={setImageUrl}
              />
            </div>
            <input
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              placeholder="Đường dẫn liên kết (khi click)"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
            />
            <input
              type="number"
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              placeholder="Thứ tự hiển thị (VD: 1)"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition"
            >
              {saving ? "Đang tạo..." : "Lưu banner"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {bannersList.map(b => (
          <div key={b.id} className="rounded-2xl bg-sidebar overflow-hidden transition hover:bg-sidebar-accent flex flex-col justify-between">
            <img src={b.imageUrl} alt={b.title} className="h-40 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-base">{b.title}</p>
                  {b.linkUrl && <p className="text-xs text-primary truncate max-w-[200px] mt-0.5">{b.linkUrl}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Thứ tự hiển thị: {b.sortOrder}</p>
                </div>
                <StatusBadge status={b.isActive ? "Hiển thị" : "Ẩn"} />
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  title="Bật/Tắt hiển thị"
                  type="button"
                  onClick={() => handleToggleActive(b)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg transition ${b.isActive ? "bg-green-950/40 text-green-400 hover:bg-green-900/40" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  {b.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </button>
                <button
                  title="Xóa banner"
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {bannersList.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12 bg-sidebar rounded-2xl">
          Không tìm thấy banner nào.
        </p>
      )}
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
