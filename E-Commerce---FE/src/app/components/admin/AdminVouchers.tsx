import { parseRes } from '../../../utils/api';

import {
  CircleCheck,
  Edit,
  Loader2,
  Trash2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { getAccessToken, getStoredUser } from "../authSession";
import { StatusBadge, TableHeader } from "./AdminShared";

export function AdminVouchers() {
  const user = getStoredUser();
  const isManager = user?.role === "store_manager";
  const isAdmin = user?.role === "admin";

  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [voucherTypeMode, setVoucherTypeMode] = useState<'general' | 'points' | 'rank'>('general');
  const [filterTypeMode, setFilterTypeMode] = useState<'all' | 'general' | 'points' | 'rank'>('all');
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [productId, setProductId] = useState("");
  const [categoriesId, setCategoriesId] = useState("");
  const [applicableTierId, setApplicableTierId] = useState("");
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [description, setDescription] = useState("");
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [pointsRequired, setPointsRequired] = useState("");
  const [discountedPointsRequired, setDiscountedPointsRequired] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState(isManager ? user?.branchId || "" : "");

  const loadCoupons = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsOnly = async () => {
    try {
      const pRes = await fetch(`${env.API_URL}/products`);
      if (pRes.ok) {
        const resData = await parseRes(pRes);
        setProducts(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategoriesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/categories`);
      if (res.ok) {
        const resData = await parseRes(res);
        setCategories(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSizesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/sizes/distinct`);
      if (res.ok) {
        const resData = await parseRes(res);
        setAvailableSizes(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBranchesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/branches/active`);
      if (res.ok) {
        const resData = await parseRes(res);
        setBranches(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTiersOnly = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/points/admin/loyalty-tiers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const resData = await parseRes(res);
        setTiers(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadProductsOnly();
    loadCategoriesOnly();
    loadSizesOnly();
    loadBranchesOnly();
    loadTiersOnly();
  }, []);

  const notifyVouchersChanged = () => {
    window.dispatchEvent(new CustomEvent('sb-vouchers-updated'));
    window.dispatchEvent(new CustomEvent('sb-notifications-updated'));
    try {
      const channel = new BroadcastChannel('sb_vouchers_channel');
      channel.postMessage('vouchers_updated');
      channel.close();
    } catch (err) {}
    try {
      const channelN = new BroadcastChannel('sb_notifications_channel');
      channelN.postMessage('notifications_updated');
      channelN.close();
    } catch (err) {}
  };

  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeTiers = Array.isArray(tiers) ? tiers : [];
  const safeBranches = Array.isArray(branches) ? branches : [];

  const buildAutoDescription = () => {
    const parts: string[] = [];

    if (voucherTypeMode === 'points' && pointsRequired) {
      const origPts = Number(pointsRequired).toLocaleString('vi-VN');
      if (discountedPointsRequired && Number(discountedPointsRequired) > 0 && Number(discountedPointsRequired) < Number(pointsRequired)) {
        const discPts = Number(discountedPointsRequired).toLocaleString('vi-VN');
        parts.push(`Đổi ${discPts}pt (từ ${origPts}pt):`);
      } else {
        parts.push(`Đổi ${origPts} điểm:`);
      }
    } else if (voucherTypeMode === 'rank' && applicableTierId) {
      const selTier = safeTiers.find(t => t.id === applicableTierId);
      if (selTier) parts.push(`Hạng ${selTier.name}:`);
    }

    if (discountValue) {
      if (discountType === "percent") {
        let desc = `Giảm ${discountValue}%`;
        if (maxDiscount && Number(maxDiscount) > 0) {
          desc += ` (tối đa ${Number(maxDiscount).toLocaleString('vi-VN')}đ)`;
        }
        parts.push(desc);
      } else {
        parts.push(`Giảm ${Number(discountValue).toLocaleString('vi-VN')}đ`);
      }
    }

    if (productId) {
      const selProd = safeProducts.find(p => p.id === productId);
      if (selProd) parts.push(`cho sản phẩm "${selProd.name}"`);
    } else if (categoriesId) {
      const selCat = safeCategories.find(c => c.id === categoriesId);
      if (selCat) parts.push(`cho danh mục "${selCat.name}"`);
    } else {
      parts.push(`cho tất cả sản phẩm,`);
    }

    if (targetSize) {
      parts.push(`size ${targetSize}`);
    } else {
      parts.push(`tất cả các size,`);
    }

    if (branchId) {
      const selBranch = safeBranches.find(b => b.id === branchId);
      if (selBranch) parts.push(`tại chi nhánh "${selBranch.name}"`);
    } else {
      parts.push(`tại tất cả chi nhánh`);
    }

    if (minOrderValue && Number(minOrderValue) > 0) {
      parts.push(`cho đơn từ ${Number(minOrderValue).toLocaleString('vi-VN')}đ.`);
    }

    if (minQuantity && Number(minQuantity) > 1) {
      parts.push(`tối thiểu ${minQuantity} sản phẩm.`);
    }

    return parts.join(' ');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiresAt) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (discountType === "percent" && Number(discountValue) > 100) {
      toast.error("Giá trị giảm giá theo phần trăm không được vượt quá 100%.");
      return;
    }
    if (discountType === "percent" && Number(discountValue) <= 0) {
      toast.error("Giá trị giảm giá theo phần trăm phải lớn hơn 0%.");
      return;
    }
    const token = getAccessToken();
    setSaving(true);
    try {
      const isEditing = !!editingVoucher;
      const url = isEditing ? `${env.API_URL}/admin/vouchers/${editingVoucher.id}` : `${env.API_URL}/admin/vouchers`;
      const method = isEditing ? "PATCH" : "POST";

      const finalPointsRequired = voucherTypeMode === 'points' && pointsRequired ? Number(pointsRequired) : 0;
      const finalDiscountedPoints = voucherTypeMode === 'points' && discountedPointsRequired ? Number(discountedPointsRequired) : null;
      const finalApplicableTierId = voucherTypeMode === 'rank' && applicableTierId ? applicableTierId : null;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
          minQuantity: minQuantity ? Math.max(1, Number(minQuantity)) : 1,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          startsAt: new Date(),
          expiresAt: new Date(expiresAt),
          productId: productId || null,
          categoriesId: categoriesId || null,
          targetSize: targetSize || null,
          branchId: branchId || null,
          applicableTierId: finalApplicableTierId,
          description: description.trim() || buildAutoDescription(),
          isActive: isActive,
          pointsRequired: finalPointsRequired,
          discountedPointsRequired: finalDiscountedPoints,
        }),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(isEditing ? "Cập nhật voucher thành công." : "Tạo voucher thành công.");
        setVoucherTypeMode('general');
        setCode("");
        setDiscountValue("");
        setMinOrderValue("");
        setMinQuantity("");
        setMaxDiscount("");
        setUsageLimit("");
        setExpiresAt("");
        setProductId("");
        setCategoriesId("");
        setTargetSize("");
        setBranchId(isManager ? user?.branchId || "" : "");
        setApplicableTierId("");
        setDescription("");
        setPointsRequired("");
        setDiscountedPointsRequired("");
        setIsActive(true);
        setEditingVoucher(null);
        loadCoupons();
        notifyVouchersChanged();
      } else {
        toast.error(data.message || "Lỗi khi lưu voucher.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (v: any) => {
    setEditingVoucher(v);
    if (v.pointsRequired && Number(v.pointsRequired) > 0) {
      setVoucherTypeMode('points');
    } else if (v.applicableTierId || v.applicableTier) {
      setVoucherTypeMode('rank');
    } else {
      setVoucherTypeMode('general');
    }

    setCode(v.code);
    setDiscountType(v.discountType);
    setDiscountValue(String(Math.round(Number(v.discountValue))));
    setMinOrderValue(String(v.minOrderValue));
    setMinQuantity(v.minQuantity && Number(v.minQuantity) > 1 ? String(v.minQuantity) : "");
    setMaxDiscount(v.maxDiscount ? String(v.maxDiscount) : "");
    setUsageLimit(v.usageLimit ? String(v.usageLimit) : "");
    const dateStr = v.expiresAt ? new Date(v.expiresAt).toISOString().split('T')[0] : "";
    setExpiresAt(dateStr);
    setProductId(v.productId || "");
    setCategoriesId(v.categoriesId || "");
    setTargetSize(v.targetSize || "");
    setBranchId(v.branchId || "");
    setApplicableTierId(v.applicableTierId || v.applicableTier?.id || "");
    setDescription(v.description || "");
    setPointsRequired(v.pointsRequired ? String(v.pointsRequired) : "");
    setDiscountedPointsRequired(v.discountedPointsRequired ? String(v.discountedPointsRequired) : "");
    setIsActive(v.isActive !== false);
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
    setVoucherTypeMode('general');
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinOrderValue("");
    setMinQuantity("");
    setMaxDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setProductId("");
    setCategoriesId("");
    setTargetSize("");
    setBranchId(isManager ? user?.branchId || "" : "");
    setApplicableTierId("");
    setDescription("");
    setPointsRequired("");
    setDiscountedPointsRequired("");
    setIsActive(true);
  };

  const getFilteredSizes = () => {
    if (!productId) return availableSizes;
    const selProd = safeProducts.find(p => p.id === productId);
    if (!selProd || !selProd.variants) return [];
    const sizes = selProd.variants.map((v: any) => v.size).filter(Boolean);
    return Array.from(new Set(sizes.map((s: string) => s.trim()))) as string[];
  };

  const handleApprove = async (id: string) => {
    const couponObj = safeCoupons.find(c => c.id === id);
    const actionLabel = couponObj?.isPendingDelete ? "duyệt xóa" : "phê duyệt";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} voucher này không?`)) return;
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/vouchers/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Đã duyệt voucher thành công.");
        loadCoupons();
        notifyVouchersChanged();
      } else {
        toast.error(data.message || "Lỗi khi duyệt voucher.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này không?")) return;
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/vouchers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa voucher thành công.");
        loadCoupons();
        notifyVouchersChanged();
      } else {
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const filteredCoupons = safeCoupons.filter(c => {
    if (filterTypeMode === 'points') return c.pointsRequired && Number(c.pointsRequired) > 0;
    if (filterTypeMode === 'rank') return c.applicableTierId || c.applicableTier;
    if (filterTypeMode === 'general') return (!c.pointsRequired || Number(c.pointsRequired) === 0) && !c.applicableTierId && !c.applicableTier;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý voucher</h2>
      </div>

      <div className="overflow-auto rounded-2xl bg-sidebar p-5 space-y-4">
        {/* Filter Tabs by Voucher Type */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-sidebar-accent">
          <span className="text-xs font-bold text-muted-foreground mr-1">Lọc theo loại:</span>
          {[
            { key: 'all', label: 'Tất cả Voucher' },
            { key: 'general', label: 'Voucher Tổng Thể' },
            { key: 'points', label: 'Voucher Đổi Điểm' },
            { key: 'rank', label: 'Voucher Theo Hạng' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTypeMode(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTypeMode === tab.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-sidebar-accent text-muted-foreground hover:bg-sidebar'
              }`}
            >
              {tab.label} ({
                tab.key === 'all'
                  ? safeCoupons.length
                  : tab.key === 'points'
                    ? safeCoupons.filter(c => c.pointsRequired && Number(c.pointsRequired) > 0).length
                    : tab.key === 'rank'
                      ? safeCoupons.filter(c => c.applicableTierId || c.applicableTier).length
                      : safeCoupons.filter(c => (!c.pointsRequired || Number(c.pointsRequired) === 0) && !c.applicableTierId && !c.applicableTier).length
              })
            </button>
          ))}
        </div>

        <table className="w-full text-sm">
          <TableHeader cols={["Mã", "Sản phẩm", "Giá trị", "Giảm tối đa", "Đơn tối thiểu", "SL tối thiểu", "Đã dùng / Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
          <tbody>
            {filteredCoupons.map(v => {
              const hasLimit = v.usageLimit !== null;
              const usedRatio = hasLimit ? Math.round((v.usedCount / v.usageLimit) * 100) : 0;
              const isExpired = new Date(v.expiresAt) < new Date();
              const status = (v.isPendingDelete && !isAdmin)
                ? "Chờ duyệt xóa"
                : !v.isApproved
                  ? "Chờ duyệt"
                  : isExpired ? "Hết hạn" : (v.isActive ? "Hoạt động" : "Tạm khóa");

              return (
                <tr key={v.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                  <td className="py-3">
                    {v.productId && v.product ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-500 font-semibold">
                        {v.product.name}
                      </span>
                    ) : v.categoriesId && v.category ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs text-purple-500 font-semibold">
                        {v.category.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Tất cả sản phẩm</span>
                    )}
                    {v.targetSize && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-500 font-semibold ml-1">
                        Size: {v.targetSize}
                      </span>
                    )}
                    {v.branchId && v.branch && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-600 font-semibold ml-1">
                        {v.branch.name}
                      </span>
                    )}
                    {(v.applicableTierId || v.applicableTier) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 font-semibold ml-1 border border-amber-500/20">
                        Dành riêng cho Hạng {v.applicableTier?.name || 'thành viên'}
                      </span>
                    )}
                    {v.pointsRequired && Number(v.pointsRequired) > 0 ? (
                      v.discountedPointsRequired && Number(v.discountedPointsRequired) > 0 && Number(v.discountedPointsRequired) < Number(v.pointsRequired) ? (
                        (() => {
                          const origP = Number(v.pointsRequired);
                          const discP = Number(v.discountedPointsRequired);
                          const pct = Math.round(((origP - discP) / origP) * 100);
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-500 font-semibold ml-1">
                              Đổi {discP.toLocaleString('vi-VN')} điểm <span className="line-through text-red-400/60 font-normal">({origP.toLocaleString('vi-VN')})</span> <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">-{pct}%</span>
                            </span>
                          );
                        })()
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 font-semibold ml-1">
                          Đổi {Number(v.pointsRequired).toLocaleString('vi-VN')} điểm
                        </span>
                      )
                    ) : null}
                  </td>
                  <td className="py-3 font-semibold text-foreground">
                    {v.discountType === "percent" ? `${Number(v.discountValue)}%` : formatMoney(Number(v.discountValue))}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {v.maxDiscount ? formatMoney(Number(v.maxDiscount)) : "K.Giới hạn"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {Number(v.minOrderValue) > 0 ? formatMoney(Number(v.minOrderValue)) : "0đ"}
                  </td>
                  <td className="py-3 text-muted-foreground font-semibold">
                    {Number(v.minQuantity || 1) > 1 ? `${v.minQuantity} SP` : "1 SP"}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1 w-24">
                      {hasLimit && (
                        <div className="h-1.5 w-full rounded-full bg-sidebar-accent overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${usedRatio >= 100 ? 'bg-red-500' : usedRatio >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(usedRatio, 100)}%` }}
                          />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {v.usedCount}/{hasLimit ? v.usageLimit : "∞"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3"><StatusBadge status={status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {isAdmin && (!v.isApproved || v.isPendingDelete) && (
                        <button
                          title={v.isPendingDelete ? "Duyệt xóa" : "Duyệt voucher"}
                          onClick={() => handleApprove(v.id)}
                          className="inline-flex size-8 items-center justify-center rounded-lg bg-green-950/40 text-green-400 hover:bg-green-900/40 transition animate-pulse"
                        >
                          <CircleCheck size={14} />
                        </button>
                      )}
                      <button
                        title="Sửa voucher"
                        onClick={() => handleStartEdit(v)}
                        className="inline-flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-primary hover:bg-sidebar transition"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        title="Xóa voucher"
                        onClick={() => handleDelete(v.id)}
                        className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCoupons.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy voucher nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT VOUCHER FORM */}
      <form onSubmit={handleSave} className="rounded-2xl bg-sidebar p-5 space-y-4 border border-sidebar-accent shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
          <span>{editingVoucher ? `Chỉnh sửa voucher: ${editingVoucher.code}` : "Tạo voucher mới"}</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Dropdown Selector for Voucher Type / Category */}
          <div className="col-span-full bg-sidebar-accent/60 p-3.5 rounded-2xl border border-sidebar-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider text-primary">MỤC ĐÍCH / PHÂN LOẠI VOUCHER:</span>
            </div>
            <select
              className="rounded-xl bg-background px-4 py-2 text-sm font-bold text-foreground outline-none border border-primary/40 shadow-xs cursor-pointer hover:border-primary transition"
              value={voucherTypeMode}
              onChange={e => {
                const mode = e.target.value as 'general' | 'points' | 'rank';
                setVoucherTypeMode(mode);
                if (mode === 'general') {
                  setPointsRequired('');
                  setDiscountedPointsRequired('');
                  setApplicableTierId('');
                } else if (mode === 'points') {
                  setApplicableTierId('');
                } else if (mode === 'rank') {
                  setPointsRequired('');
                  setDiscountedPointsRequired('');
                }
              }}
            >
              <option value="general">Voucher Tổng Thể (Công khai cho toàn bộ đơn hàng)</option>
              <option value="points">Voucher Đổi Điểm (Thành viên dùng Điểm thưởng để đổi)</option>
              <option value="rank">Voucher Theo Hạng (Đặc quyền riêng cho Hạng thành viên)</option>
            </select>
          </div>

          <input
            required
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent font-mono font-bold uppercase"
            placeholder="Mã voucher (VD: SUMMER30)"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={discountType}
            onChange={e => setDiscountType(e.target.value)}
          >
            <option value="percent">Loại: Phần trăm (%)</option>
            <option value="fixed">Cố định (đ)</option>
          </select>
          <input
            required
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Giá trị (VD: 20 hoặc 50000)"
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
          />
          <input
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Đơn tối thiểu (đ)"
            value={minOrderValue}
            onChange={e => setMinOrderValue(e.target.value)}
          />
          <input
            type="number"
            min="1"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="SL sản phẩm tối thiểu (VD: 1 hoặc 2)"
            value={minQuantity}
            onChange={e => setMinQuantity(e.target.value)}
          />
          {discountType === "percent" && (
            <input
              type="number"
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
              placeholder="Giảm tối đa (đ) - Để trống nếu không giới hạn"
              value={maxDiscount}
              onChange={e => setMaxDiscount(e.target.value)}
            />
          )}

          {/* Conditional inputs for Points Voucher */}
          {voucherTypeMode === 'points' && (
            <>
              <input
                required
                type="number"
                className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-foreground outline-none placeholder:text-amber-600/60 font-semibold"
                placeholder="Số điểm gốc để đổi (VD: 15000)"
                value={pointsRequired}
                onChange={e => setPointsRequired(e.target.value)}
              />
              <input
                type="number"
                className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-foreground outline-none placeholder:text-amber-600/60 font-semibold"
                placeholder="Số điểm ưu đãi/discount (để trống nếu không giảm)"
                value={discountedPointsRequired}
                onChange={e => setDiscountedPointsRequired(e.target.value)}
              />
            </>
          )}

          {/* Conditional inputs for Rank Voucher */}
          {voucherTypeMode === 'rank' && (
            <select
              required
              className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 font-bold outline-none cursor-pointer"
              value={applicableTierId}
              onChange={e => setApplicableTierId(e.target.value)}
            >
              <option value="">Bắt buộc chọn Hạng thành viên áp dụng...</option>
              {safeTiers.filter(t => t.tierLevel > 1).map(t => (
                <option key={t.id} value={t.id}>
                  Dành riêng cho Hạng {t.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="number"
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
            placeholder="Giới hạn lượt dùng (để trống nếu vô hạn)"
            value={usageLimit}
            onChange={e => setUsageLimit(e.target.value)}
          />
          <input
            required
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={productId}
            onChange={e => {
              const val = e.target.value;
              setProductId(val);
              if (val) {
                setCategoriesId("");
                // Auto-reset targetSize if not supported by the new product variants
                const selProd = safeProducts.find(p => p.id === val);
                if (selProd && selProd.variants) {
                  const sizes = selProd.variants.map((v: any) => v.size || "");
                  const exists = sizes.some((s: string) => s.trim() === targetSize);
                  if (!exists) setTargetSize("");
                }
              }
            }}
          >
            <option value="">Sản phẩm: Tất cả</option>
            {safeProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category?.name || 'Khác'})
              </option>
            ))}
          </select>
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={categoriesId}
            onChange={e => { setCategoriesId(e.target.value); if (e.target.value) setProductId(""); }}
          >
            <option value="">Danh mục: Tất cả</option>
            {safeCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
            >
              <option value="">Chi nhánh áp dụng: Tất cả</option>
              {safeBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={targetSize}
            onChange={e => setTargetSize(e.target.value)}
          >
            <option value="">Size áp dụng: Tất cả</option>
            {getFilteredSizes().map(sz => (
              <option key={sz} value={sz}>Size áp dụng: {sz}</option>
            ))}
          </select>
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={isActive ? "true" : "false"}
            onChange={e => setIsActive(e.target.value === "true")}
          >
            <option value="true">Trạng thái: Hoạt động (Active)</option>
            <option value="false">Trạng thái: Tạm khóa (Inactive)</option>
          </select>

          {/* Description field with Auto-Generate button */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Mô tả Voucher:</span>
              <button
                type="button"
                onClick={() => {
                  const autoDesc = buildAutoDescription();
                  if (autoDesc) {
                    setDescription(autoDesc);
                    toast.success("Đã tự động tạo mô tả voucher từ dữ liệu ở trên!");
                  } else {
                    toast.error("Vui lòng nhập giá trị giảm giá hoặc thông số voucher trước.");
                  }
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition hover:bg-primary/20"
              >
                ✨ Tự động tạo mô tả từ dữ liệu ở trên
              </button>
            </div>
            <input
              className="w-full rounded-xl bg-sidebar-accent px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent focus:border-primary transition"
              placeholder="Mô tả voucher (VD: Giảm 35% tối đa 80k cho đơn từ 50k khi mua tối thiểu 2 SP)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
            {editingVoucher && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-sidebar-accent px-6 py-2 text-sm text-muted-foreground hover:bg-sidebar transition cursor-pointer"
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              {saving ? "Đang lưu..." : (editingVoucher ? "Cập nhật voucher" : "Tạo voucher")}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
