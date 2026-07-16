
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
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminUsers() {
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
