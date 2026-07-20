import React from 'react';

export function AdminUserModal({
  editingUser, setEditingUser,
  creatingUser, setCreatingUser,
  saving,
  needsBranch,
  branches,
  saveUser,
  createUser
}: any) {
  return (
    <>
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
                      {branches.map((branch: any) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
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
                      {branches.map((branch: any) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
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
    </>
  );
}
