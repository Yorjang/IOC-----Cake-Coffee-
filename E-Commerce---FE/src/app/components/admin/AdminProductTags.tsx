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
import { getAccessToken } from "../authSession";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminProductTags() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const load = async () => {
    setLoading(true);
    try { const res = await fetch(`${env.API_URL}/admin/tags`); if (res.ok) setItems(await parseRes(res)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const openForm = (tag?: any) => { setEditing(tag || null); setName(tag?.name || ""); setShowModal(true); };
  const save = async () => {
    if (!name.trim()) return toast.error("Vui lòng nhập tên tag.");
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${env.API_URL}/admin/tags${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: name.trim() }) });
      if (!res.ok) { const error = await parseRes(res); throw new Error(error.message); }
      setShowModal(false); await load(); toast.success(editing ? "Đã cập nhật tag." : "Đã tạo tag.");
    } catch (error: any) { toast.error(error.message || "Không thể lưu tag."); }
  };
  const remove = async (tag: any) => {
    if (!confirm(`Xóa tag “${tag.name}”? Tag sẽ được gỡ khỏi các sản phẩm.`)) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${env.API_URL}/admin/tags/${tag.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const error = await parseRes(res); throw new Error(error.message); }
      await load(); toast.success("Đã xóa tag.");
    } catch (error: any) { toast.error(error.message || "Không thể xóa tag."); }
  };
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold text-foreground">Tag sản phẩm</h2><p className="mt-1 text-sm text-muted-foreground">Mỗi tag tạo thành một khu vực sản phẩm trên trang chủ.</p></div><AdminBtn onClick={() => openForm()}><span className="flex items-center gap-1"><Plus size={14} />Thêm tag</span></AdminBtn></div>
    {loading ? <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div> : <div className="overflow-auto rounded-2xl bg-sidebar"><table className="w-full text-sm"><TableHeader cols={["Tên tag", "Slug/API", "Thao tác"]} /><tbody>{items.map(tag => <tr key={tag.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition"><td className="py-3 font-medium text-foreground">{tag.name}</td><td className="py-3 font-mono text-xs text-muted-foreground">?tag={tag.slug}</td><td className="py-3"><div className="flex gap-2"><AdminBtn variant="ghost" onClick={() => openForm(tag)}><Edit size={14} /></AdminBtn><AdminBtn variant="danger" onClick={() => remove(tag)}><Trash2 size={14} /></AdminBtn></div></td></tr>)}</tbody></table></div>}
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="w-full max-w-md rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={event => event.stopPropagation()}><h3 className="mb-4 text-lg font-semibold text-foreground">{editing ? "Sửa tag" : "Thêm tag mới"}</h3><input autoFocus className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Ví dụ: Bán chạy" value={name} onChange={event => setName(event.target.value)} /><div className="mt-5 flex justify-end gap-3"><AdminBtn variant="ghost" onClick={() => setShowModal(false)}>Hủy</AdminBtn><AdminBtn onClick={save}>{editing ? "Cập nhật" : "Tạo tag"}</AdminBtn></div></div></div>}
  </div>;
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



