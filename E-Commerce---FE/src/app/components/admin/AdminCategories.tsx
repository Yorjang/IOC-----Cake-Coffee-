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
import { ImageUploader, StatusBadge, AdminBtn, TableHeader, deleteStorageImage } from "./AdminShared";

export function AdminCategories() {
  const isAdmin = getStoredUser()?.role === "admin";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });

  const getToken = () => getAccessToken();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/admin/categories`);
      if (res.ok) setItems(await parseRes(res));
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "", imageUrl: "" }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, description: c.description || "", imageUrl: c.imageUrl || "" }); setShowModal(true); };

  const save = async () => {
    const token = getToken();
    if (!token) return;
    const url = editing ? `${env.API_URL}/admin/categories/${editing.id}` : `${env.API_URL}/admin/categories`;
    const method = editing ? "PATCH" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await parseRes(res); throw new Error(err.message); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi lưu danh mục"); }
  };

  const remove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm("Xóa danh mục này?")) return;
    const item = items.find(c => c.id === id);
    try {
      const res = await fetch(`${env.API_URL}/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await parseRes(res); throw new Error(err.message); }
      if (item?.imageUrl) {
        await deleteStorageImage(item.imageUrl);
      }
      load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi xóa danh mục"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý danh mục</h2>
        {isAdmin && (
          <AdminBtn onClick={openAdd}><span className="flex items-center gap-1"><Plus size={14} />Thêm danh mục</span></AdminBtn>
        )}
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


const WEEK_DAYS = [
  { value: "monday", label: "Thứ Hai" },
  { value: "tuesday", label: "Thứ Ba" },
  { value: "wednesday", label: "Thứ Tư" },
  { value: "thursday", label: "Thứ Năm" },
  { value: "friday", label: "Thứ Sáu" },
  { value: "saturday", label: "Thứ Bảy" },
  { value: "sunday", label: "Chủ Nhật" },
];

const defaultOpeningHours = () => WEEK_DAYS.map(day => ({
  dayOfWeek: day.value,
  openingTime: "07:00",
  closingTime: "22:00",
  isClosed: false,
}));


