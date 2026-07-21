import React from "react";
import { useAdminUsers } from "../../features/admin/hooks/useAdminUsers";
import { AdminUserTable } from "../../features/admin/ui/AdminUserTable";
import { AdminUserModal } from "../../features/admin/ui/AdminUserModal";

export function AdminUsers() {
  const {
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
  } = useAdminUsers();

  return (
    <div className="space-y-5">
      <AdminUserTable 
        filteredUsers={filteredUsers}
        search={search} setSearch={setSearch}
        loading={loading}
        needsBranch={needsBranch}
        branchName={branchName}
        setEditingUser={setEditingUser}
        deleteUser={deleteUser}
        openCreateUser={openCreateUser}
        loadUsers={loadUsers}
      />
      
      <AdminUserModal 
        editingUser={editingUser} setEditingUser={setEditingUser}
        creatingUser={creatingUser} setCreatingUser={setCreatingUser}
        saving={saving}
        needsBranch={needsBranch}
        branches={branches}
        saveUser={saveUser}
        createUser={createUser}
      />
    </div>
  );
}
