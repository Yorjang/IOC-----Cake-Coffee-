import { useAdminBranches } from "../../features/admin/hooks/useAdminBranches";
import { AdminBranchModal } from "../../features/admin/ui/AdminBranchModal";
import { AdminBranchTable } from "../../features/admin/ui/AdminBranchTable";

export function AdminBranches({ adminUser }: { adminUser?: any }) {
  const {
    branchRows,
    loading,
    saving,
    branchForm, setBranchForm,
    scheduleBranch, setScheduleBranch,
    openingHours,
    loadingHours,
    savingHours,
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
  } = useAdminBranches({ adminUser });

  return (
    <div className="space-y-6">
      <AdminBranchTable 
        branchRows={branchRows}
        loading={loading}
        adminUser={adminUser}
        statusLabel={statusLabel}
        canManageBranch={canManageBranch}
        canEditOpeningHours={canEditOpeningHours}
        openSchedule={openSchedule}
        deleteBranch={deleteBranch}
        setBranchForm={setBranchForm}
        emptyBranchForm={emptyBranchForm}
        loadBranches={loadBranches}
      />
      
      <AdminBranchModal 
        branchForm={branchForm} setBranchForm={setBranchForm}
        scheduleBranch={scheduleBranch} setScheduleBranch={setScheduleBranch}
        openingHours={openingHours}
        loadingHours={loadingHours}
        saving={saving}
        savingHours={savingHours}
        saveBranch={saveBranch}
        saveOpeningHours={saveOpeningHours}
        updateOpeningHour={updateOpeningHour}
        WEEK_DAYS={WEEK_DAYS}
      />
    </div>
  );
}
