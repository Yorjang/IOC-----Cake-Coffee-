import { useState } from 'react';
import { Coins, Edit, Search, Trash2 } from 'lucide-react';
import { AdminBtn, StatusBadge, TableHeader } from '../../../components/admin/AdminShared';
import { AdminAdjustPointsModal } from './AdminAdjustPointsModal';

export function AdminUserTable({
  filteredUsers,
  search, setSearch,
  loading,
  needsBranch,
  branchName,
  setEditingUser,
  deleteUser,
  openCreateUser,
  loadUsers
}: any) {
  const [adjustingUser, setAdjustingUser] = useState<any>(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý người dùng</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={openCreateUser} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition">
            Cấp tài khoản
          </button>
          <button onClick={loadUsers} className="rounded-xl bg-sidebar px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent transition">
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm">
            <Search size={14} className="text-muted-foreground" />
            <input 
              className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-44" 
              placeholder="Tìm tên, email…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Họ tên", "Email", "SĐT", "Vai trò", "Điểm thưởng", "Chi nhánh", "Trạng thái", "Tham gia", "Thao tác"]} />
          <tbody>
            {filteredUsers.map((u: any) => (
              <tr key={u.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-medium text-foreground">{u.fullName}</td>
                <td className="py-3 text-muted-foreground">{u.email || "-"}</td>
                <td className="py-3 text-muted-foreground">{u.phone || "-"}</td>
                <td className="py-3"><span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{u.role}</span></td>
                <td className="py-3 font-mono font-bold text-amber-600 dark:text-amber-400">{(u.points || 0).toLocaleString('vi-VN')} đ</td>
                <td className="py-3 text-muted-foreground">{needsBranch(u.role) ? branchName(u.branchId) : "-"}</td>
                <td className="py-3"><StatusBadge status={u.isActive ? "Hoạt động" : "Ẩn"} /></td>
                <td className="py-3 text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost" onClick={() => setAdjustingUser(u)} title="Điều chỉnh điểm"><Coins size={14} className="text-amber-500" /></AdminBtn>
                    <AdminBtn variant="ghost" onClick={() => setEditingUser({ ...u })}><Edit size={14} /></AdminBtn>
                    <AdminBtn variant="danger" onClick={() => deleteUser(u)}><Trash2 size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Không có người dùng nào.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Đang tải danh sách người dùng...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adjustingUser && (
        <AdminAdjustPointsModal
          user={adjustingUser}
          onClose={() => setAdjustingUser(null)}
          onSuccess={() => loadUsers?.()}
        />
      )}
    </>
  );
}
