import { useState } from 'react';
import {
  Award,
  Calendar,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAdminLoyalty, type LoyaltyTierConfig } from '../hooks/useAdminLoyalty';

export function AdminLoyalty() {
  const {
    tiers,
    members,
    loadingTiers,
    loadingMembers,
    search,
    setSearch,
    tierFilter,
    setTierFilter,
    page,
    totalPages,
    totalMembers,
    fetchMembers,
    editingTier,
    setEditingTier,
    savingTier,
    handleSaveTier,
    recalculating,
    recalculateReport,
    setRecalculateReport,
    handleTriggerRecalculate,
    adjustingMember,
    setAdjustingMember,
    selectedTargetTierId,
    setSelectedTargetTierId,
    adjustReason,
    setAdjustReason,
    savingAdjust,
    handleSaveAdjustUserTier,
  } = useAdminLoyalty();

  const [activeTab, setActiveTab] = useState<'config' | 'members'>('config');
  const [confirmRecalculate, setConfirmRecalculate] = useState(false);

  // Edit tier form local state
  const [editForm, setEditForm] = useState<Partial<LoyaltyTierConfig>>({});

  const openEditModal = (tier: LoyaltyTierConfig) => {
    setEditingTier(tier);
    setEditForm({
      name: tier.name,
      minSpent: tier.minSpent,
      minProducts: tier.minProducts,
      discountPercent: tier.discountPercent,
      bonusPointRate: tier.bonusPointRate,
      color: tier.color,
      description: tier.description,
    });
  };

  const openAdjustModal = (member: any) => {
    setAdjustingMember(member);
    setSelectedTargetTierId(member.currentTier?.id || (tiers[0]?.id ?? ''));
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-sidebar border border-border p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award size={14} /> Loyalty Tier Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground">Quản lý Hạng Thành Viên</h2>
          <p className="text-xs text-muted-foreground">
            Cấu hình 5 bậc hạng tích điểm, mốc điều kiện (Tiền & Số sản phẩm), tổng kết định kỳ 3 tháng & giáng hạng 1 năm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmRecalculate(true)}
          disabled={recalculating}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {recalculating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang tổng kết...
            </>
          ) : (
            <>
              <RotateCcw size={16} /> Tổng kết hạng 3 tháng
            </>
          )}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-sidebar text-muted-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Sparkles size={14} /> Cấu hình 5 Bậc hạng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'members'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-sidebar text-muted-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Users size={14} /> Danh sách Thành viên ({totalMembers})
        </button>
      </div>

      {/* TAB 1: CONFIG 5 TIERS */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {loadingTiers ? (
              <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs">Đang tải cấu hình 5 bậc hạng...</span>
              </div>
            ) : (
              tiers.map((tier) => {
                const minSpent = Number(tier.minSpent || 0);
                const minProducts = Number(tier.minProducts || 0);

                return (
                  <div
                    key={tier.id}
                    className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    {/* Header color accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-2"
                      style={{ backgroundColor: tier.color || '#8B5CF6' }}
                    />

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase text-white shadow-xs"
                          style={{ backgroundColor: tier.color || '#8B5CF6' }}
                        >
                          Tier {tier.tierLevel}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(tier)}
                          className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
                          title="Sửa mốc điều kiện"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold font-serif text-foreground">{tier.name}</h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {tier.description || 'Chưa có mô tả'}
                        </p>
                      </div>

                      {/* Conditions list */}
                      <div className="space-y-2 rounded-2xl bg-secondary/50 p-3 text-xs border border-border/50">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Chi tiêu tối thiểu:</span>
                          <span className="font-bold font-mono text-foreground">
                            {minSpent > 0 ? `${minSpent.toLocaleString('vi-VN')} đồng` : '0 đồng (Mặc định)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Sản phẩm tối thiểu:</span>
                          <span className="font-bold font-mono text-foreground">
                            {minProducts > 0 ? `${minProducts} SP` : '0 SP'}
                          </span>
                        </div>
                        {tier.tierLevel > 1 && (
                          <div className="pt-1.5 border-t border-border flex justify-between items-center">
                            <span className="text-muted-foreground">Ưu đãi Voucher:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              Voucher riêng Hạng {tier.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Business Rules Informational Card */}
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-6 space-y-3 text-xs leading-relaxed text-foreground">
            <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <ShieldAlert size={16} /> Quy tắc vận hành Hệ thống Loyalty Tier
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Điều kiện kép:</strong> Để nâng hoặc giữ hạng, người dùng phải thỏa mãn <span className="underline">ĐỒNG THỜI</span> cả 2 điều kiện <em>Chi tiêu tối thiểu</em> VÀ <em>Số lượng sản phẩm đã mua</em>.
              </li>
              <li>
                <strong className="text-foreground">Cập nhật realtime khi hoàn thành đơn:</strong> Khi đơn hàng chuyển sang trạng thái Completed, hệ thống tự động cộng dồn doanh số & kiểm tra nâng hạng lập tức.
              </li>
              <li>
                <strong className="text-foreground">Tổng kết 3 tháng:</strong> Định kỳ mỗi 3 tháng (Quý), hệ thống quét toàn bộ khách hàng để xem họ đủ điều kiện duy trì hạng hay nâng hạng.
              </li>
              <li>
                <strong className="text-foreground">Quy tắc giáng hạng 1 năm:</strong> Nếu trong vòng <strong className="text-red-500">365 ngày (1 năm)</strong> không phát sinh bất kỳ đơn hàng/thanh toán hoàn tất nào, người dùng sẽ bị reset về hạng mặc định <strong>Tier 1 (Đồng)</strong>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS LIST & MANUAL TIER ADJUSTMENT */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Tìm tên, email, sđt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Filter size={14} /> Lọc Bậc hạng:
              </div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="">Tất cả Bậc hạng</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tier {t.tierLevel} - {t.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => fetchMembers(page)}
                disabled={loadingMembers}
                className="p-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer disabled:opacity-50"
                title="Làm mới danh sách"
              >
                <RefreshCw size={14} className={loadingMembers ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Members Table */}
          {loadingMembers ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-xs">Đang tải danh sách khách hàng...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
              <Users size={32} className="mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">Hạng hiện tại</th>
                    <th className="py-3.5 px-4">Tổng tiền đã chi</th>
                    <th className="py-3.5 px-4">Số SP đã mua</th>
                    <th className="py-3.5 px-4">Đơn cuối cùng</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const currentTier = m.currentTier;
                    const totalSpent = Number(m.totalSpent || 0);
                    const totalProducts = Number(m.totalProductsPurchased || 0);
                    const lastOrderDate = m.lastOrderCompletedAt
                      ? new Date(m.lastOrderCompletedAt).toLocaleDateString('vi-VN')
                      : 'Chưa có';

                    return (
                      <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {m.fullName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{m.fullName || 'Chưa đặt tên'}</p>
                              <p className="text-[11px] text-muted-foreground">{m.email || m.phone || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {currentTier ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                              style={{ backgroundColor: currentTier.color || '#8B5CF6' }}
                            >
                              <Award size={12} /> {currentTier.name}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-secondary text-muted-foreground">
                              Tier 1 (Mặc định)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono text-foreground">
                          {totalSpent.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3.5 px-4 font-semibold font-mono text-foreground">
                          {totalProducts} SP
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono">
                          {lastOrderDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(m)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs transition cursor-pointer border border-amber-500/20"
                          >
                            Đổi hạng
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground font-medium">
                Hiển thị trang {page} / {totalPages} (Tổng {totalMembers} thành viên)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchMembers(page - 1)}
                  disabled={page <= 1 || loadingMembers}
                  className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold px-2">{page}</span>
                <button
                  type="button"
                  onClick={() => fetchMembers(page + 1)}
                  disabled={page >= totalPages || loadingMembers}
                  className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT TIER THRESHOLDS */}
      {editingTier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setEditingTier(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card text-foreground p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: editForm.color || '#8B5CF6' }}
                />
                <h3 className="font-serif text-lg font-bold">Sửa cấu hình Hạng {editingTier.name}</h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-secondary">
                Tier {editingTier.tierLevel}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên Bậc Hạng:</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Chi tiêu tối thiểu (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.minSpent ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, minSpent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Sản phẩm tối thiểu (SP):</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.minProducts ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, minProducts: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tỷ lệ giảm giá (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={editForm.discountPercent ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, discountPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Màu sắc đại diện (Hex/CSS):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.color || '#8B5CF6'}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="size-9 rounded-xl border border-border bg-background cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={editForm.color || '#8B5CF6'}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Mô tả hiển thị:</label>
                <textarea
                  rows={3}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-secondary font-semibold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={savingTier}
                onClick={() => handleSaveTier(editForm)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingTier ? <Loader2 size={14} className="animate-spin" /> : <CircleCheck size={14} />}
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM RECALCULATE 3 MONTHS */}
      {confirmRecalculate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setConfirmRecalculate(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/20 bg-card text-foreground p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5">
              <RotateCcw className="size-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold">Xác nhận Tổng kết hạng 3 tháng</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống sẽ duyệt toàn bộ khách hàng, tính toán tổng số tiền & sản phẩm từ các đơn hàng hoàn tất. Nếu trong vòng 1 năm không mua hàng, hạng sẽ bị đưa về Tier 1 (Đồng).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRecalculate(false)}
                className="w-1/2 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-secondary font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmRecalculate(false);
                  handleTriggerRecalculate();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> Chạy tổng kết ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECALCULATE REPORT SUMMARY */}
      {recalculateReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setRecalculateReport(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/20 bg-card text-foreground p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CircleCheck size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold">Báo cáo Tổng kết Hạng 3 tháng</h3>
              <p className="text-xs text-muted-foreground">Chạy thành công vào {new Date().toLocaleTimeString('vi-VN')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-left">
              <div className="p-3 rounded-2xl bg-secondary/60 space-y-0.5">
                <span className="text-muted-foreground text-[11px]">Tổng số thành viên:</span>
                <p className="text-lg font-bold font-mono">{recalculateReport.totalUsers}</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Được nâng hạng:</span>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{recalculateReport.upgradedUsers}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold">Duy trì hạng cũ:</span>
                <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                  {recalculateReport.retainedUsers}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-0.5">
                <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">Reset do quá 1 năm:</span>
                <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  {recalculateReport.resetInactiveUsers}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRecalculateReport(null)}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs cursor-pointer"
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: MANUAL ADJUST MEMBER TIER */}
      {adjustingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setAdjustingMember(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card text-foreground p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold">Thay đổi hạng thủ công (Admin)</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/50 flex items-center gap-3">
                <div className="size-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
                  {adjustingMember.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-sm">{adjustingMember.fullName}</p>
                  <p className="text-muted-foreground">{adjustingMember.email || adjustingMember.phone}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Chọn Hạng đích:</label>
                <select
                  value={selectedTargetTierId}
                  onChange={(e) => setSelectedTargetTierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-hidden cursor-pointer"
                >
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tier {t.tierLevel} - {t.name} ({Number(t.minSpent).toLocaleString('vi-VN')}đ / {t.minProducts} SP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lý do thay đổi:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã hỗ trợ offline, Thưởng sự kiện..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setAdjustingMember(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-secondary font-semibold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={savingAdjust || !selectedTargetTierId}
                onClick={handleSaveAdjustUserTier}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingAdjust ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                Cập nhật hạng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
