import { parseRes } from '../../../utils/api';

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "../authSession";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

function createComboSku(name: string): string {
  const normalizedName = name.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toUpperCase();
  const nameWithoutPrefix = normalizedName.startsWith("COMBO-")
    ? normalizedName.slice("COMBO-".length)
    : normalizedName;
  return nameWithoutPrefix ? `COMBO-${nameWithoutPrefix}` : "SKU sẽ tự tạo theo tên combo";
}

export function AdminCombos() {
  const user = getStoredUser();
  const isManager = user?.role === "store_manager";
  const isAdmin = user?.role === "admin";

  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const emptyForm = () => ({ 
    name: "", 
    description: "", 
    imageUrl: "", 
    price: "", 
    isActive: true,
    branchId: isManager ? user?.branchId || "" : ""
  });
  const [form, setForm] = useState<any>(emptyForm());
  const [items, setItems] = useState<any[]>([]);
  const token = () => getAccessToken();

  const load = async () => {
    setLoading(true);
    try {
      const accessToken = token();
      const headers: any = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const [comboRes, productRes, branchRes] = await Promise.all([
        fetch(`${env.API_URL}/combos`, { headers }),
        fetch(`${env.API_URL}/combos/available-products`, { headers }),
        fetch(`${env.API_URL}/branches/active`),
      ]);
      if (comboRes.ok) setCombos(await parseRes(comboRes));
      if (productRes.ok) setProducts(await parseRes(productRes));
      if (branchRes.ok) setBranches(await parseRes(branchRes));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addItem = () => setItems(current => [...current, { childProductId: "", childVariantId: "", quantity: 1 }]);
  const updateItem = (index: number, changes: any) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setItems([{ childProductId: "", childVariantId: "", quantity: 1 }]);
    setShowModal(true);
  };
  const openEdit = (combo: any) => {
    const variant = combo.variants?.[0];
    setEditing(combo);
    setForm({ 
      name: combo.name, 
      description: combo.description || "", 
      imageUrl: combo.imageUrl || "", 
      price: String(variant?.price ?? ""), 
      isActive: combo.isActive,
      branchId: combo.branchId || (isManager ? user?.branchId || "" : "")
    });
    setItems((combo.items || []).map((item: any) => ({ childProductId: item.childProductId, childVariantId: item.childVariantId || "", quantity: item.quantity })));
    setShowModal(true);
  };
  const save = async () => {
    if (!form.name.trim() || form.price === "") return toast.error("Vui lòng nhập đủ tên và giá combo.");
    if (!items.length || items.some(item => !item.childProductId || Number(item.quantity) < 1)) return toast.error("Combo cần ít nhất một sản phẩm thành phần hợp lệ.");
    const accessToken = token();
    if (!accessToken) return;
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/combos${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ 
          ...form, 
          name: form.name.trim(), 
          price: Number(form.price), 
          branchId: form.branchId || null,
          items: items.map(item => ({ childProductId: item.childProductId, childVariantId: item.childVariantId || undefined, quantity: Number(item.quantity) }))
        }),
      });
      if (!res.ok) { const error = await parseRes(res); throw new Error(Array.isArray(error.message) ? error.message.join(", ") : error.message); }
      setShowModal(false); await load(); toast.success(editing ? "Đã cập nhật combo." : "Đã tạo combo.");
    } catch (error: any) { toast.error(error.message || "Không thể lưu combo."); }
    finally { setSaving(false); }
  };
  const remove = async (combo: any) => {
    if (!confirm(`Xóa combo “${combo.name}”?`)) return;
    const accessToken = token();
    if (!accessToken) return;
    try {
      const res = await fetch(`${env.API_URL}/combos/${combo.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) { const error = await parseRes(res); throw new Error(error.message); }
      await load(); toast.success("Đã xóa combo.");
    } catch (error: any) { toast.error(error.message || "Không thể xóa combo."); }
  };

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-foreground">Quản lý combo</h2><p className="mt-1 text-sm text-muted-foreground">Tạo gói sản phẩm và thiết lập giá bán chung.</p></div><AdminBtn onClick={openAdd}><span className="flex items-center gap-1"><Plus size={14} />Thêm combo</span></AdminBtn></div>
    {loading ? <div className="py-10 text-center text-muted-foreground"><Loader2 className="mr-2 inline animate-spin" size={16} />Đang tải…</div> : <div className="overflow-auto rounded-2xl bg-sidebar"><table className="w-full text-sm"><TableHeader cols={["Combo", "Chi nhánh", "Giá", "Thành phần", "Trạng thái", "Thao tác"]} /><tbody>{combos.map(combo => <tr key={combo.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent"><td className="py-3 pr-4"><div className="flex items-center gap-3">{combo.imageUrl && <img src={combo.imageUrl} alt={combo.name} className="size-10 rounded-lg object-cover" />}<div><p className="font-medium text-foreground">{combo.name}</p><p className="font-mono text-xs text-muted-foreground">{combo.variants?.[0]?.sku}</p></div></div></td><td className="py-3 text-muted-foreground">{combo.branchId && combo.branch ? <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-600 font-semibold">🏬 {combo.branch.name}</span> : <span className="text-xs text-muted-foreground">Toàn hệ thống</span>}</td><td className="py-3 font-semibold text-primary">{Number(combo.variants?.[0]?.price || 0).toLocaleString("vi-VN")}đ</td><td className="py-3 text-muted-foreground">{combo.items?.length || 0} sản phẩm</td><td className="py-3"><StatusBadge status={combo.isActive ? "Hiển thị" : "Ẩn"} /></td><td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost" onClick={() => openEdit(combo)}><Edit size={14} /></AdminBtn><AdminBtn variant="danger" onClick={() => remove(combo)}><Trash2 size={14} /></AdminBtn></div></td></tr>)}</tbody></table></div>}
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
      <h3 className="mb-4 text-lg font-semibold text-foreground">{editing ? "Sửa combo" : "Thêm combo mới"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm outline-none" placeholder="Tên combo" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
        <div className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm">
          <span className="block text-xs text-muted-foreground">SKU tự động</span>
          <span className="font-mono text-foreground">{createComboSku(form.name)}</span>
        </div>
        <input type="number" min="0" step="1000" className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm font-semibold text-primary outline-none" placeholder="Giá combo" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} />
        {isAdmin && (
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm outline-none sm:col-span-2"
            value={form.branchId}
            onChange={event => setForm({ ...form, branchId: event.target.value })}
          >
            <option value="">Chi nhánh áp dụng: Toàn hệ thống</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                🏬 {b.name}
              </option>
            ))}
          </select>
        )}
        <textarea className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm outline-none sm:col-span-2" rows={2} placeholder="Mô tả combo" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /><div className="sm:col-span-2"><ImageUploader label="Hình ảnh combo" value={form.imageUrl} onChange={imageUrl => setForm({ ...form, imageUrl })} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />Hiển thị combo</label></div>
      <div className="mt-5 rounded-2xl border border-sidebar-accent p-4"><div className="mb-3 flex items-center justify-between"><div><h4 className="font-semibold">Sản phẩm thành phần</h4><p className="text-xs text-muted-foreground">Chọn sản phẩm, biến thể và số lượng trong combo.</p></div><AdminBtn variant="ghost" onClick={addItem}><span className="flex items-center gap-1"><Plus size={14} />Thêm sản phẩm</span></AdminBtn></div><div className="space-y-3">{items.map((item, index) => { const selectedProduct = products.find(product => product.id === item.childProductId); return <div key={index} className="grid items-end gap-3 rounded-xl bg-sidebar-accent p-3 md:grid-cols-[minmax(180px,1fr)_minmax(160px,1fr)_100px_40px]"><label className="grid gap-1 text-xs text-muted-foreground">Sản phẩm<select className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground" value={item.childProductId} onChange={event => updateItem(index, { childProductId: event.target.value, childVariantId: "" })}><option value="">-- Chọn --</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label className="grid gap-1 text-xs text-muted-foreground">Biến thể<select className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground" value={item.childVariantId} onChange={event => updateItem(index, { childVariantId: event.target.value })}><option value="">Mặc định / bất kỳ</option>{(selectedProduct?.variants || []).map((variant: any) => <option key={variant.id} value={variant.id}>{variant.variantName} - {Number(variant.price).toLocaleString("vi-VN")}đ</option>)}</select></label><label className="grid gap-1 text-xs text-muted-foreground">Số lượng<input type="number" min="1" className="rounded-lg bg-sidebar px-3 py-2 text-sm" value={item.quantity} onChange={event => updateItem(index, { quantity: event.target.value })} /></label><button type="button" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-9 place-items-center rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button></div>; })}</div></div>
      <div className="mt-5 flex justify-end gap-3"><AdminBtn variant="ghost" onClick={() => setShowModal(false)}>Hủy</AdminBtn><AdminBtn onClick={save} disabled={saving}>{saving ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo combo"}</AdminBtn></div>
    </div></div>}
  </div>;
}



