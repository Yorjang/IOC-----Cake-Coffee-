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

export function AdminStoreMap() {
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
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


