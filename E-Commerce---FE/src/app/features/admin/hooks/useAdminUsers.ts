import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAccessToken } from "../../../components/authSession";
import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";

export function useAdminUsers() {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState<any>(null);

  const getToken = () => getAccessToken();
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
      if (!res.ok) throw new Error(data.message || "Không thể xóa người dùng.");

      setAdminUsers(prev => prev.filter(item => item.id !== user.id));
      toast.success("Đã xóa người dùng.");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa người dùng.");
    }
  };

  return {
    adminUsers, setAdminUsers,
    branches, setBranches,
    search, setSearch,
    loading, setLoading,
    saving, setSaving,
    editingUser, setEditingUser,
    creatingUser, setCreatingUser,
    branchRoles,
    needsBranch,
    branchName,
    loadUsers,
    loadBranches,
    filteredUsers,
    saveUser,
    openCreateUser,
    createUser,
    deleteUser
  };
}
