import React, { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../config/supabase";


import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Store, MapPin, Boxes
} from "lucide-react";

export type AdminRole = "admin" | "store_manager" | "staff" | "cashier";

export const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Quản trị viên",
  store_manager: "Quản lý cửa hàng",
  staff: "Nhân viên",
  cashier: "Thu ngân",
};

export const WEEK_DAYS = [
  { value: "monday", label: "Thứ Hai" },
  { value: "tuesday", label: "Thứ Ba" },
  { value: "wednesday", label: "Thứ Tư" },
  { value: "thursday", label: "Thứ Năm" },
  { value: "friday", label: "Thứ Sáu" },
  { value: "saturday", label: "Thứ Bảy" },
  { value: "sunday", label: "Chủ Nhật" },
];

export const defaultOpeningHours = () => WEEK_DAYS.map(day => ({
  dayOfWeek: day.value,
  openingTime: "07:00",
  closingTime: "22:00",
  isClosed: false,
}));

export const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBag, allowedRoles: ["admin", "store_manager", "staff", "cashier"] },
  { key: "branches", label: "Chi nhánh", icon: Store, allowedRoles: ["admin", "store_manager"] },
  { key: "storeMap", label: "Bản đồ", icon: MapPin, allowedRoles: ["admin", "store_manager"] },
  { key: "products", label: "Sản phẩm", icon: Package, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "combos", label: "Combo", icon: Boxes, allowedRoles: ["admin", "store_manager"] },
  { key: "categories", label: "Danh mục", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "productTags", label: "Tag sản phẩm", icon: Tag, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "inventory", label: "Tồn kho", icon: Boxes, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "users", label: "Người dùng", icon: Users, allowedRoles: ["admin"] },
  { key: "reviews", label: "Đánh giá", icon: Star, allowedRoles: ["admin", "store_manager", "staff"] },
  { key: "vouchers", label: "Voucher", icon: Tag, allowedRoles: ["admin", "store_manager"] },
  { key: "banners", label: "Banner", icon: Image, allowedRoles: ["admin", "store_manager"] },
  { key: "revenue", label: "Thống kê", icon: BarChart2, allowedRoles: ["admin", "store_manager"] },
  { key: "settings", label: "Cài đặt", icon: Settings, allowedRoles: ["admin"] },
] satisfies Array<{
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  allowedRoles: AdminRole[];
}>;

export function ImageUploader({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file tối đa là 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from('cakeandcoffee')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('cakeandcoffee')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Tải ảnh lên thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh lên thất bại. Vui lòng kiểm tra VITE_SUPABASE_ANON_KEY.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground block">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-12 rounded-xl border border-sidebar-accent overflow-hidden shrink-0">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-0 bg-black/60 grid place-items-center opacity-0 hover:opacity-100 transition text-[10px] text-white font-semibold"
            >
              Xóa
            </button>
          </div>
        ) : (
          <label className="flex size-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-accent bg-sidebar-accent/50 text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground transition shrink-0">
            {uploading ? (
              <Loader2 className="animate-spin text-primary" size={16} />
            ) : (
              <UploadCloud size={16} />
            )}
            <span className="text-[9px] mt-0.5 font-semibold">{uploading ? "Đang tải" : "Chọn file"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
        <div className="flex-1">
          <input
            className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-xs text-foreground outline-none border border-sidebar-accent placeholder:text-muted-foreground"
            placeholder="Hoặc nhập liên kết URL ảnh..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}

export async function deleteStorageImage(imageUrl: string) {
  if (!imageUrl) return;
  if (imageUrl.includes("supabase.co/storage/v1/object/public/cakeandcoffee/")) {
    const parts = imageUrl.split("/cakeandcoffee/");
    if (parts.length > 1) {
      const filePath = parts[1];
      try {
        const { error } = await supabase.storage.from("cakeandcoffee").remove([filePath]);
        if (error) console.error("Failed to delete storage file:", error);
      } catch (err) {
        console.error("Error deleting storage file:", err);
      }
    }
  }
}

export const statusColor: Record<string, string> = {
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Hoàn thành": "bg-green-100 text-green-700",
  "Xác nhận": "bg-purple-100 text-purple-700",
  "Huỷ": "bg-red-100 text-red-700",
  "Đang bán": "bg-green-100 text-green-700",
  "Hết hàng": "bg-red-100 text-red-700",
  "Đặt trước": "bg-yellow-100 text-yellow-700",
  "Hoạt động": "bg-green-100 text-green-700",
  "VIP": "bg-amber-100 text-amber-700",
  "Mới": "bg-blue-100 text-blue-700",
  "Đã duyệt": "bg-green-100 text-green-700",
  "Chờ duyệt": "bg-yellow-100 text-yellow-700",
  "Ẩn": "bg-gray-100 text-gray-700",
  "Đang hoạt động": "bg-green-100 text-green-700",
  "Hết lượt": "bg-red-100 text-red-700",
  "Hiển thị": "bg-green-100 text-green-700",
  "Tạm đóng": "bg-yellow-100 text-yellow-700",
  "Đủ hàng": "bg-green-100 text-green-700",
  "Sắp hết": "bg-yellow-100 text-yellow-700",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export function AdminBtn({ children, variant = "primary", onClick, disabled = false }: any) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary/80"
    : variant === "danger"
      ? "bg-red-100 text-red-700 hover:bg-red-200"
      : "border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary-foreground";
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-8 min-w-10 items-center justify-center rounded-lg px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}>{children}</button>;
}

export function TableHeader({ cols }: { cols: string[] }) {
  return <thead><tr className="border-b border-sidebar-accent">{cols.map(c => <th key={c} className="pb-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{c}</th>)}</tr></thead>;
}
