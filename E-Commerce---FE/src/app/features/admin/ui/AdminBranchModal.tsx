import React from 'react';
import { Loader2 } from 'lucide-react';

export function AdminBranchModal({
  branchForm, setBranchForm,
  scheduleBranch, setScheduleBranch,
  openingHours,
  loadingHours,
  saving,
  savingHours,
  saveBranch,
  saveOpeningHours,
  updateOpeningHour,
  WEEK_DAYS
}: any) {
  return (
    <>
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
                {WEEK_DAYS.map((day: any) => {
                  const item = openingHours.find((hour: any) => hour.dayOfWeek === day.value);
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
    </>
  );
}
