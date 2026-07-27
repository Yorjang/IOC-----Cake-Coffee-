import { useState, useEffect } from "react";
import { toast } from "sonner";
import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";

const WEEK_DAYS = [
  { value: "monday", label: "Thứ 2" },
  { value: "tuesday", label: "Thứ 3" },
  { value: "wednesday", label: "Thứ 4" },
  { value: "thursday", label: "Thứ 5" },
  { value: "friday", label: "Thứ 6" },
  { value: "saturday", label: "Thứ 7" },
  { value: "sunday", label: "Chủ nhật" },
];

const defaultOpeningHours = () => WEEK_DAYS.map(day => ({
  dayOfWeek: day.value,
  openingTime: "07:00",
  closingTime: "22:00",
  isClosed: false,
}));

export function useAdminBranches({ adminUser }: { adminUser?: any }) {
  const [loading, setLoading] = useState(false);
  const [branchRows, setBranchRows] = useState<any[]>([]);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
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
      const data = await parseRes(res);
      if (!res.ok) throw new Error(data.message || "Không thể lưu giờ mở cửa.");
      toast.success("Đã cập nhật giờ mở cửa.");
      setScheduleBranch(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu giờ mở cửa.");
    } finally {
      setSavingHours(false);
    }
  };


  return {
    branchRows, setBranchRows,
    loading, setLoading,
    saving, setSaving,
    branchForm, setBranchForm,
    scheduleBranch, setScheduleBranch,
    openingHours, setOpeningHours,
    loadingHours, setLoadingHours,
    savingHours, setSavingHours,
    statusLabel,
    emptyBranchForm,
    loadBranches,
    saveBranch,
    deleteBranch,
    canEditOpeningHours,
    canManageBranch,
    openSchedule,
    updateOpeningHour,
    saveOpeningHours,
    WEEK_DAYS
  };
}
