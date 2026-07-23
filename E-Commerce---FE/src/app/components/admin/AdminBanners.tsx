import { parseRes } from '../../../utils/api';

import React, { useState, useEffect } from "react";
import {
  Edit, Trash2, Plus, CheckCircle, XCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "../authSession";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminBanners() {
  const user = getStoredUser();
  const isManager = user?.role === "store_manager";
  const isAdmin = user?.role === "admin";

  const [bannersList, setBannersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState(isManager ? user?.branchId || "" : "");

  const [subtitle, setSubtitle] = useState("");
  // Form states
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadBanners = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setBannersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: any) => { 
    setEditingBanner(banner); 
    setTitle(banner.title || ""); 
    setSubtitle(banner.subtitle || ""); 
    setImageUrl(banner.imageUrl || ""); 
    setLinkUrl(banner.linkUrl || ""); 
    setSortOrder(String(banner.sortOrder ?? 0)); 
    setBranchId(banner.branchId || (isManager ? user?.branchId || "" : ""));
    setShowAddForm(true); 
  };
  
  const loadBranches = async () => {
    try {
      const res = await fetch(`${env.API_URL}/branches/active`);
      if (res.ok) setBranches(await parseRes(res));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBanners();
    loadBranches();
  }, []);

  const handleToggleActive = async (banner: any) => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/banners/${banner.id}/active`, {
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
        const errData = await parseRes(res);
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
    const banner = bannersList.find((b: any) => b.id === id);
    try {
      const res = await fetch(`${env.API_URL}/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa banner thành công.");
        loadBanners();
      } else {
        const errData = await parseRes(res);
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
    const isEditing = Boolean(editingBanner);
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/admin/banners${isEditing ? `/${editingBanner.id}` : ""}`, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subtitle,
          title,
          imageUrl,
          linkUrl,
          sortOrder: Number(sortOrder),
          isActive: editingBanner?.isActive ?? true,
          branchId: branchId || null,
        }),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Lưu banner thành công.");
        setTitle("");
        setImageUrl("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800");
        setSubtitle("");
        setLinkUrl("");
        setSortOrder("1");
        setBranchId(isManager ? user?.branchId || "" : "");
        setShowAddForm(false);
        setEditingBanner(null);
        loadBanners();
      } else {
        setEditingBanner(null);
        toast.error(data.message || "Lỗi khi lưu banner.");
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
            <textarea className="sm:col-span-2 min-h-20 rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent" placeholder={"M\u00f4 t\u1ea3 ng\u1eafn hi\u1ec3n th\u1ecb d\u01b0\u1edbi ti\u00eau \u0111\u1ec1"} value={subtitle} onChange={e => setSubtitle(e.target.value)} />
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
            {isAdmin && (
              <select
                className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
              >
                <option value="">Chi nhánh áp dụng: Tất cả</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    🏬 {b.name}
                  </option>
                ))}
              </select>
            )}
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
                  {b.branchId && b.branch && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-600 font-semibold mt-1">
                      🏬 {b.branch.name}
                    </span>
                  )}
                </div>
                <StatusBadge status={b.isActive ? "Hiển thị" : "Ẩn"} />
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button title="Edit banner" type="button" onClick={() => handleEdit(b)} className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-950/40 text-blue-400 hover:bg-blue-900/40 transition"><Edit size={14} /></button>
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


