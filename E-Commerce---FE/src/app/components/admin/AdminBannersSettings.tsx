import { Image, Plus, Edit, ToggleLeft, Trash2 } from "lucide-react";
import { banners } from "../../../data/adminMockData";
import { StatusBadge, AdminBtn } from "./AdminShared";

export function AdminBanners() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý banner</h2>
        <AdminBtn><span className="flex items-center gap-1"><Plus size={14} />Thêm banner</span></AdminBtn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map(b => (
          <div key={b.id} className="rounded-2xl bg-sidebar overflow-hidden transition hover:bg-sidebar-accent">
            <img src={b.img} alt={b.title} className="h-28 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-medium text-foreground">{b.title}</p><p className="mt-1 text-xs text-muted-foreground">{b.position} · {b.start} → {b.end}</p></div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 flex gap-2">
                <AdminBtn variant="ghost"><Edit size={14} /></AdminBtn>
                <AdminBtn variant="ghost"><ToggleLeft size={14} /></AdminBtn>
                <AdminBtn variant="danger"><Trash2 size={14} /></AdminBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border-2 border-dashed border-sidebar-accent p-8 text-center">
        <Image size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Kéo thả hoặc <span className="text-primary cursor-pointer">chọn ảnh</span> để tạo banner mới</p>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const storeFields = ["Tên cửa hàng", "Email liên hệ", "Số điện thoại", "Địa chỉ"];
  const storeDefaults = ["Sweet Bean Coffee & Cake", "hello@sweetbean.vn", "0909 888 777", "123 Nguyễn Huệ, Q1, TP.HCM"];
  const payments: [string, boolean][] = [["COD", true], ["Momo", true], ["VNPay", true], ["ZaloPay", false]];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Cài đặt hệ thống</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Thông tin cửa hàng</h3>
          {storeFields.map((label, i) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" defaultValue={storeDefaults[i]} />
            </div>
          ))}
          <AdminBtn>Lưu thay đổi</AdminBtn>
        </div>
        <div className="rounded-2xl bg-sidebar p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Cổng thanh toán</h3>
          {payments.map(([name, active]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{name}</span>
              <button className={`rounded-full px-3 py-1 text-xs transition ${active ? "bg-green-900/50 text-green-400" : "bg-sidebar-accent text-muted-foreground"}`}>
                {active ? "Bật" : "Tắt"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
