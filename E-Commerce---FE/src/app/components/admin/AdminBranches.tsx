import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader, WEEK_DAYS, defaultOpeningHours } from "./AdminShared";

export function AdminBranches({ adminUser }: { adminUser?: any }) {
  const [branchRows, setBranchRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branchForm, setBranchForm] = useState<any>(null);
  const [scheduleBranch, setScheduleBranch] = useState<any>(null);
  const [openingHours, setOpeningHours] = useState<any[]>(defaultOpeningHours());
  const [loadingHours, setLoadingHours] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

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

  const canEditOpeningHours = (branch: any) =>
    (adminUser?.role ?? "admin") === "admin" ||
    (adminUser?.role === "store_manager" && adminUser?.branchId === branch.id);

  const canManageBranch = (branch: any) =>
    (adminUser?.role ?? "admin") === "admin" || adminUser?.branchId === branch.id;

  const openSchedule = async (branch: any) => {
    setScheduleBranch(branch);
    setOpeningHours(defaultOpeningHours());
    setLoadingHours(true);
    try {
      const res = await fetch(`${env.API_URL}/branches/${branch.id}/opening-hours`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tải giờ mở cửa.");
      const byDay = new Map(data.map((item: any) => [item.dayOfWeek, item]));
      setOpeningHours(defaultOpeningHours().map(item => {
        const saved: any = byDay.get(item.dayOfWeek);
        return saved ? {
          dayOfWeek: item.dayOfWeek,
          openingTime: saved.openingTime?.slice(0, 5) || "07:00",
          closingTime: saved.closingTime?.slice(0, 5) || "22:00",
          isClosed: !!saved.isClosed,
        } : item;
      }));
    } catch (err: any) {
      toast.error(err.message || "Không thể tải giờ mở cửa.");
    } finally {
      setLoadingHours(false);
    }
  };

  const updateOpeningHour = (dayOfWeek: string, changes: any) => {
    setOpeningHours(prev => prev.map(item =>
      item.dayOfWeek === dayOfWeek ? { ...item, ...changes } : item,
    ));
  };

  const saveOpeningHours = async () => {
    if (!scheduleBranch) return;
    const token = getToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại để lưu giờ mở cửa.");
      return;
    }
    setSavingHours(true);
    try {
      const res = await fetch(`${env.API_URL}/branches/${scheduleBranch.id}/opening-hours`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ openingHours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể lưu giờ mở cửa.");
      toast.success("Đã cập nhật giờ mở cửa.");
      setScheduleBranch(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu giờ mở cửa.");
    } finally {
      setSavingHours(false);
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
          {(adminUser?.role ?? "admin") === "admin" && (
            <AdminBtn onClick={() => setBranchForm(emptyBranchForm())}><span className="flex items-center gap-1"><Plus size={14} />Thêm chi nhánh</span></AdminBtn>
          )}
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
              {canManageBranch(branch) && <AdminBtn variant="ghost" onClick={() => setBranchForm({ ...branch })}><Edit size={14} /></AdminBtn>}
              {canEditOpeningHours(branch) && (
                <AdminBtn variant="ghost" onClick={() => openSchedule(branch)}>
                  <span className="flex items-center gap-1"><Clock size={14} />Giờ mở cửa</span>
                </AdminBtn>
              )}
              {(adminUser?.role ?? "admin") === "admin" && <AdminBtn variant="danger" onClick={() => deleteBranch(branch)}><Trash2 size={14} /></AdminBtn>}
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

      {scheduleBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-sidebar-accent bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Giờ mở cửa</h3>
                <p className="mt-1 text-sm text-muted-foreground">{scheduleBranch.name}</p>
              </div>
              <button onClick={() => setScheduleBranch(null)} className="rounded-full bg-sidebar px-3 py-1 text-sm text-muted-foreground hover:bg-sidebar-accent">Đóng</button>
            </div>

            {loadingHours ? (
              <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <div className="space-y-3">
                {WEEK_DAYS.map(day => {
                  const item = openingHours.find(hour => hour.dayOfWeek === day.value);
                  return (
                    <div key={day.value} className="grid items-center gap-3 rounded-xl bg-sidebar p-3 sm:grid-cols-[110px_1fr_1fr_130px]">
                      <span className="text-sm font-semibold text-foreground">{day.label}</span>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        Mở cửa
                        <input type="time" disabled={item?.isClosed} value={item?.openingTime || "07:00"} onChange={e => updateOpeningHour(day.value, { openingTime: e.target.value })} className="rounded-lg bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none disabled:opacity-40" />
                      </label>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        Đóng cửa
                        <input type="time" disabled={item?.isClosed} value={item?.closingTime || "22:00"} onChange={e => updateOpeningHour(day.value, { closingTime: e.target.value })} className="rounded-lg bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none disabled:opacity-40" />
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground sm:justify-end">
                        <input type="checkbox" checked={!!item?.isClosed} onChange={e => updateOpeningHour(day.value, { isClosed: e.target.checked })} className="size-4 accent-primary" />
                        Đóng cả ngày
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setScheduleBranch(null)} className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar">Hủy</button>
              <button onClick={saveOpeningHours} disabled={loadingHours || savingHours} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
                {savingHours ? "Đang lưu..." : "Lưu giờ mở cửa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
