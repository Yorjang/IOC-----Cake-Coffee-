import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';

export interface LoyaltyTierConfig {
  id: string;
  tierLevel: number;
  name: string;
  minSpent: number;
  minProducts: number;
  discountPercent: number;
  bonusPointRate: number;
  color: string;
  description: string;
}

export interface LoyaltyMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  totalSpent: number;
  totalProductsPurchased: number;
  lastOrderCompletedAt?: string;
  currentTier?: LoyaltyTierConfig;
}

export function useAdminLoyalty() {
  const [tiers, setTiers] = useState<LoyaltyTierConfig[]>([]);
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Pagination & Filter state for members
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Edit Modal State
  const [editingTier, setEditingTier] = useState<LoyaltyTierConfig | null>(null);
  const [savingTier, setSavingTier] = useState(false);

  // Manual Adjust Modal State
  const [adjustingMember, setAdjustingMember] = useState<LoyaltyMember | null>(null);
  const [selectedTargetTierId, setSelectedTargetTierId] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [savingAdjust, setSavingAdjust] = useState(false);

  // Recalculating state
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateReport, setRecalculateReport] = useState<any | null>(null);

  const fetchTiers = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingTiers(true);
    try {
      const res = await fetch(`${env.API_URL}/points/admin/loyalty-tiers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setTiers(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || 'Lỗi khi tải danh sách bậc hạng.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể kết nối đến máy chủ.');
    } finally {
      setLoadingTiers(false);
    }
  };

  const fetchMembers = async (currentPage = page) => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingMembers(true);
    try {
      let url = `${env.API_URL}/points/admin/loyalty-members?page=${currentPage}&limit=10`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (tierFilter) url += `&tierId=${tierFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setMembers(data.items || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        setTotalMembers(data.total || 0);
      } else {
        toast.error(data.message || 'Lỗi khi tải danh sách thành viên.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  useEffect(() => {
    fetchMembers(1);
  }, [search, tierFilter]);

  const handleSaveTier = async (updatedData: Partial<LoyaltyTierConfig>) => {
    if (!editingTier) return;
    const token = getAccessToken();
    if (!token) return;
    setSavingTier(true);
    try {
      const res = await fetch(`${env.API_URL}/points/admin/loyalty-tiers/${editingTier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(`Đã cập nhật cấu hình hạng ${data.name} thành công!`);
        setEditingTier(null);
        fetchTiers();
        fetchMembers(page);
      } else {
        toast.error(data.message || 'Không thể lưu cấu hình hạng.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu thông tin bậc hạng.');
    } finally {
      setSavingTier(false);
    }
  };

  const handleTriggerRecalculate = async () => {
    const token = getAccessToken();
    if (!token) return;
    setRecalculating(true);
    try {
      const res = await fetch(`${env.API_URL}/points/admin/loyalty-recalculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(data.message || 'Tổng kết 3 tháng hoàn tất!');
        setRecalculateReport(data);
        fetchMembers(page);
      } else {
        toast.error(data.message || 'Không thể thực hiện tổng kết hạng.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối máy chủ khi tổng kết hạng.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveAdjustUserTier = async () => {
    if (!adjustingMember || !selectedTargetTierId) return;
    const token = getAccessToken();
    if (!token) return;
    setSavingAdjust(true);
    try {
      const res = await fetch(
        `${env.API_URL}/points/admin/users/${adjustingMember.id}/loyalty-tier`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tierId: selectedTargetTierId,
            reason: adjustReason,
          }),
        },
      );
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(data.message || 'Thay đổi hạng người dùng thành công!');
        setAdjustingMember(null);
        setAdjustReason('');
        fetchMembers(page);
      } else {
        toast.error(data.message || 'Không thể điều chỉnh hạng.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối khi điều chỉnh hạng.');
    } finally {
      setSavingAdjust(false);
    }
  };

  return {
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
  };
}
