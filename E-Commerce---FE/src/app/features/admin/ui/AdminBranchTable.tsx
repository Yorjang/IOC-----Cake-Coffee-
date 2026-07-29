import { Clock, Edit, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { AdminBtn, StatusBadge } from '../../../components/admin/AdminShared';

export function AdminBranchTable({
  branchRows,
  loading,
  adminUser,
  statusLabel,
  canManageBranch,
  canEditOpeningHours,
  openSchedule,
  deleteBranch,
  setBranchForm,
  emptyBranchForm,
  loadBranches
}: any) {
  return (
    <>
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
        {branchRows.map((branch: any) => (
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
    </>
  );
}
