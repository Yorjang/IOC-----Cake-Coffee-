import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { parseRes } from "../../../utils/api";
import { AdminBtn } from "./AdminShared";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/admin/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: "store_name",
          value: settings.store_name || "",
        }),
      });
      if (res.ok) {
        toast.success("Cập nhật cài đặt thành công.");
        loadSettings();
      } else {
        const err = await parseRes(res);
        toast.error(err.message || "Lỗi khi lưu cài đặt.");
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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Cài đặt hệ thống</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleSaveStoreInfo} className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông tin cửa hàng</h3>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tên cửa hàng</label>
            <input
              className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              value={settings.store_name || ""}
              onChange={e => handleChange("store_name", e.target.value)}
              placeholder="Nhập tên cửa hàng..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Hotline</label>
            <input
              className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              value={settings.hotline || ""}
              onChange={e => handleChange("hotline", e.target.value)}
              placeholder="Nhập hotline..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email hỗ trợ</label>
            <input
              className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              value={settings.support_email || ""}
              onChange={e => handleChange("support_email", e.target.value)}
              placeholder="Nhập email hỗ trợ..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Phí giao hàng mặc định (đ)</label>
            <input
              className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              value={settings.default_shipping_fee || ""}
              onChange={e => handleChange("default_shipping_fee", e.target.value)}
              placeholder="Ví dụ: 20000"
            />
          </div>
          <AdminBtn disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</AdminBtn>
        </form>

        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cổng thanh toán & Hệ thống</h3>
          {[
            ["COD (Thanh toán khi nhận hàng)", true],
            ["Thanh toán Online (Momo/VNPay)", true],
          ].map(([name, active]) => (
            <div key={name as string} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{name as string}</span>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs transition ${active ? "bg-green-950/50 text-green-400 border border-green-800" : "bg-sidebar-accent text-muted-foreground"}`}
              >
                {active ? "Bật" : "Tắt"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
