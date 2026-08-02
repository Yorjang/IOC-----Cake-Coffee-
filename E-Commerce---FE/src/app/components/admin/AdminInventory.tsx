import { parseRes } from '../../../utils/api';

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "../authSession";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminInventory({ adminUser }: { adminUser?: any }) {
  const currentUser = adminUser || getStoredUser();
  const isAdmin = currentUser?.role === "admin";
  const isStoreManager = currentUser?.role === "store_manager";

  const [stocks, setStocks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [formQuantity, setFormQuantity] = useState("");
  const [formMinQuantity, setFormMinQuantity] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState(() => {
    if (currentUser?.role === "store_manager" && currentUser?.branchId) {
      return currentUser.branchId;
    }
    return "ALL";
  });
  const [variantFilter, setVariantFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  
  // Inbound PO flow states
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [poCodeInput, setPoCodeInput] = useState("");
  const [scanningPO, setScanningPO] = useState(false);
  const [activePO, setActivePO] = useState<any>(null);
  const [inboundItems, setInboundItems] = useState<any[]>([]);
  const [confirmingInbound, setConfirmingInbound] = useState(false);
  const [itemBarcodeScanInput, setItemBarcodeScanInput] = useState("");

  // PR (Purchase Request) flow states
  const [prs, setPrs] = useState<any[]>([]);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [showPrModal, setShowPrModal] = useState(false);
  const [prNote, setPrNote] = useState("");
  const [prItems, setPrItems] = useState<any[]>([
    { ingredientId: "", variantId: "", requestedQuantity: "10", note: "" },
  ]);
  const [submittingPr, setSubmittingPr] = useState(false);

  // Batch details states
  const [selectedStockForBatches, setSelectedStockForBatches] = useState<any>(null);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const getStockStatus = (stock: any) => {
    if (!stock) {
      return {
        status: 'NORMAL',
        emoji: '🟢',
        colorClass: 'text-emerald-500',
        bgBadge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-medium',
        qty: 0,
        min: 0,
      };
    }
    const qty = Number(stock.quantity || 0);
    const min = Number(stock.isIngredient ? (stock.minStockLevel || 0) : (stock.minQuantity || 0));

    if (qty <= min) {
      return {
        status: 'CRITICAL',
        emoji: '🔴',
        colorClass: 'text-red-500 font-bold',
        bgBadge: 'bg-red-500/15 text-red-500 border-red-500/30 font-bold',
        qty,
        min,
      };
    } else if (min > 0 && qty <= min * 1.5) {
      return {
        status: 'WARNING',
        emoji: '🟡',
        colorClass: 'text-amber-500 font-bold',
        bgBadge: 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold',
        qty,
        min,
      };
    } else {
      return {
        status: 'NORMAL',
        emoji: '🟢',
        colorClass: 'text-emerald-500 font-semibold',
        bgBadge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-medium',
        qty,
        min,
      };
    }
  };

  const loadPrs = async () => {
    const token = getAccessToken();
    try {
      setLoadingPrs(true);
      const res = await fetch(`${env.API_URL}/admin/inventory/purchase-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setPrs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrs(false);
    }
  };

  const handleCreatePr = async () => {
    if (!currentUser?.branchId && isStoreManager) {
      toast.error("Quản lý chưa được gán chi nhánh.");
      return;
    }
    const validItems = prItems.filter(i => (i.ingredientId || i.variantId) && Number(i.requestedQuantity) > 0);
    if (validItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 mặt hàng và nhập số lượng yêu cầu.");
      return;
    }

    setSubmittingPr(true);
    const token = getAccessToken();
    try {
      const body = {
        branchId: currentUser?.branchId || branches[0]?.id,
        note: prNote.trim() || undefined,
        items: validItems.map(i => ({
          ingredientId: i.ingredientId || undefined,
          variantId: i.variantId || undefined,
          requestedQuantity: Number(i.requestedQuantity),
          note: i.note || undefined,
        })),
      };

      const res = await fetch(`${env.API_URL}/admin/inventory/purchase-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(`Tạo phiếu yêu cầu đặt hàng (PR) ${data.prCode || ''} thành công!`);
        setShowPrModal(false);
        setPrNote("");
        setPrItems([{ ingredientId: "", variantId: "", requestedQuantity: "10", note: "" }]);
        loadPrs();
      } else {
        toast.error(data.message || "Lỗi khi tạo PR.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSubmittingPr(false);
    }
  };

  const handleApprovePr = async (prId: string) => {
    if (!confirm("Xác nhận DUYỆT phiếu Yêu cầu này và tự động sinh Đơn Đặt hàng (PO) gửi nhà cung cấp?")) return;
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/purchase-requests/${prId}/approve-to-pos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(data.message || "Đã duyệt PR thành công!");
        loadPrs();
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi duyệt PR.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleCancelPr = async (prId: string) => {
    const reason = prompt("Nhập lý do hủy phiếu yêu cầu đặt hàng (PR):");
    if (!reason || !reason.trim()) return;

    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/purchase-requests/${prId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelReason: reason.trim() }),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Đã hủy phiếu Yêu cầu (PR).");
        loadPrs();
      } else {
        toast.error(data.message || "Lỗi khi hủy PR.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const loadInventory = async () => {
    const token = getAccessToken();
    try {
      const [vRes, iRes] = await Promise.all([
        fetch(`${env.API_URL}/admin/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${env.API_URL}/admin/inventory/branch-ingredients`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      let variantStocks = [];
      let ingredientStocks = [];

      if (vRes.ok) {
        variantStocks = await parseRes(vRes);
      }
      if (iRes.ok) {
        ingredientStocks = await parseRes(iRes);
      }

      const normalizedVariants = variantStocks.map((s: any) => ({
        ...s,
        isIngredient: false,
      }));
      const normalizedIngredients = ingredientStocks.map((s: any) => ({
        ...s,
        isIngredient: true,
      }));

      setStocks([...normalizedVariants, ...normalizedIngredients]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setBranches(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdjustments = async () => {
    const token = getAccessToken();
    try {
      setLoadingAdjustments(true);
      const res = await fetch(`${env.API_URL}/admin/inventory/adjustments?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setAdjustments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdjustments(false);
    }
  };

  useEffect(() => {
    loadInventory();
    loadBranches();
    loadPrs();
    if (currentUser?.role === "admin") {
      loadAdjustments();
    }
  }, [currentUser]);

  const handleEdit = (stock: any) => {
    setEditingStock(stock);
    setFormQuantity(String(Math.round(Number(stock.quantity))));
    const minVal = stock.isIngredient ? (stock.minStockLevel || 0) : (stock.minQuantity || 0);
    setFormMinQuantity(String(Math.round(Number(minVal))));
    setFormReason("");
    setFormImages([]);
  };

  const handleSave = async () => {
    if (isStoreManager) {
      if (!formReason.trim()) {
        toast.error("Vui lòng nhập lý do điều chỉnh tồn kho.");
        return;
      }
      if (formImages.length === 0) {
        toast.error("Vui lòng tải lên ít nhất một ảnh minh chứng thực tế.");
        return;
      }
    }

    const token = getAccessToken();
    setSaving(true);
    try {
      const url = editingStock.isIngredient
        ? `${env.API_URL}/admin/inventory/branch-ingredients/${editingStock.id}`
        : `${env.API_URL}/admin/inventory/${editingStock.id}`;

      const body = {
        quantity: Number(formQuantity),
        ...(editingStock.isIngredient
          ? { minStockLevel: Number(formMinQuantity) }
          : { minQuantity: Number(formMinQuantity) }),
        reason: isStoreManager ? formReason.trim() : undefined,
        imageUrl: isStoreManager ? formImages.join(',') : undefined,
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(data.message || "Cập nhật tồn kho thành công.");
        setEditingStock(null);
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    const token = getAccessToken();
    if (!confirm("Bạn có chắc chắn muốn XÁC NHẬN phê duyệt thay đổi hàng hóa này?")) return;
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/adjustments/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Đã phê duyệt thay đổi tồn kho.");
        loadAdjustments();
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi phê duyệt.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleReject = async (id: string) => {
    const token = getAccessToken();
    if (!confirm("Bạn có chắc chắn muốn TỪ CHỐI thay đổi hàng hóa này?")) return;
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/adjustments/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Đã từ chối thay đổi tồn kho.");
        loadAdjustments();
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi từ chối.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleScanPO = async () => {
    if (!poCodeInput.trim()) {
      toast.error("Vui lòng nhập hoặc quét mã đơn hàng PO.");
      return;
    }
    setScanningPO(true);
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/inbound/scan?po_code=${poCodeInput.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await parseRes(res);
      if (res.ok && result.status === "success") {
        setActivePO(result.data);
        // Pre-populate items
        const items = result.data.items.map((item: any) => ({
          poItemId: item.po_item_id,
          variantId: item.variant_id,
          ingredientId: item.ingredient_id,
          name: item.name || "Sản phẩm không tên",
          isIngredient: !!item.ingredient_id,
          unit: item.unit || (item.ingredient_id ? "kg" : "Cái"),
          orderedQuantity: item.ordered_quantity,
          receivedQuantity: item.ordered_quantity,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
          batchCode: "",
          manufactureDate: new Date().toISOString().split('T')[0],
        }));
        setInboundItems(items);
        toast.success("Quét mã PO thành công!");
      } else {
        toast.error(result.message || "Không tìm thấy phiếu PO hoặc không thuộc chi nhánh này.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setScanningPO(false);
    }
  };

  const handleConfirmInbound = async () => {
    if (!activePO) return;
    for (const item of inboundItems) {
      if (Number(item.receivedQuantity) > 0 && !item.expiryDate) {
        toast.error(`Vui lòng chọn hạn sử dụng cho mặt hàng ${item.name}`);
        return;
      }
    }

    setConfirmingInbound(true);
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/inbound/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          poId: activePO.po_id,
          items: inboundItems.map(item => ({
            poItemId: item.poItemId,
            receivedQuantity: Number(item.receivedQuantity),
            expiryDate: new Date(item.expiryDate).toISOString(),
            batchCode: item.batchCode || undefined,
            manufactureDate: item.manufactureDate ? new Date(item.manufactureDate).toISOString() : undefined,
            isIngredient: item.isIngredient,
            unit: item.unit,
          }))
        })
      });
      const result = await parseRes(res);
      if (res.ok) {
        toast.success(result.message || "Nhập kho thành công!");
        setShowInboundModal(false);
        setActivePO(null);
        setPoCodeInput("");
        loadInventory();
      } else {
        toast.error(result.message || "Lỗi khi xác nhận nhập kho.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setConfirmingInbound(false);
    }
  };

  const handleViewBatches = async (stock: any) => {
    setSelectedStockForBatches(stock);
    setLoadingBatches(true);
    const token = getAccessToken();
    try {
      const url = stock.isIngredient
        ? `${env.API_URL}/admin/inventory/batches?branchId=${stock.branchId}&ingredientId=${stock.ingredientId}`
        : `${env.API_URL}/admin/inventory/batches?branchId=${stock.branchId}&variantId=${stock.variant.id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await parseRes(res);
      if (res.ok) {
        const sorted = data.sort((a: any, b: any) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
        setBatchesList(sorted);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải danh sách lô hàng.");
    } finally {
      setLoadingBatches(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const getStatus = (qty: number, min: number) => {
    if (qty === 0) return "Hết hàng";
    if (qty <= min) return "Sắp hết";
    return "Đủ hàng";
  };

  const filteredStocks = stocks.filter(s => {
    if (branchFilter !== "ALL" && s.branchId !== branchFilter) return false;
    if (typeFilter !== "ALL") {
      if (typeFilter === "PRODUCT" && s.isIngredient) return false;
      if (typeFilter === "INGREDIENT" && !s.isIngredient) return false;
    }
    if (variantFilter !== "ALL") {
      const name = s.isIngredient ? s.ingredient?.name : s.variant?.variantName;
      if (name !== variantFilter) return false;
    }
    return true;
  });

  const branchStocks = branchFilter === "ALL" ? stocks : stocks.filter(s => s.branchId === branchFilter);
  const filteredBranchStocks = branchStocks.filter(s => {
    if (typeFilter !== "ALL") {
      if (typeFilter === "PRODUCT" && s.isIngredient) return false;
      if (typeFilter === "INGREDIENT" && !s.isIngredient) return false;
    }
    return true;
  });
  const uniqueVariants = Array.from(
    new Set(
      filteredBranchStocks
        .map(s => s.isIngredient ? s.ingredient?.name : s.variant?.variantName)
        .filter(Boolean)
    )
  );

  const totalSKU = filteredStocks.length;
  const lowStock = filteredStocks.filter(s => {
    const min = s.isIngredient ? Number(s.minStockLevel || 0) : Number(s.minQuantity || 0);
    return Number(s.quantity) <= min && Number(s.quantity) > 0;
  }).length;
  const outOfStock = filteredStocks.filter(s => Number(s.quantity) === 0).length;

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE) || 1;
  const paginatedStocks = filteredStocks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const mainTableHeaders = isStoreManager
    ? ["Biến thể / Nguyên liệu", "SKU", "Tồn", "Tối thiểu", "Trạng thái", "Thao tác"]
    : ["Chi nhánh", "Biến thể / Nguyên liệu", "SKU", "Tồn", "Tối thiểu", "Trạng thái", "Thao tác"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tồn kho theo chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cảnh báo sắp hết, hết hàng và sản phẩm gần hạn để nhân viên xử lý kịp thời.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {isStoreManager && (
            <button
              onClick={() => setShowPrModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground px-4 py-2.5 text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              <ClipboardList size={16} />
              Tạo Yêu cầu (PR)
            </button>
          )}
          {isStoreManager && (
            <button
              onClick={() => setShowInboundModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2.5 text-sm font-semibold transition shadow-md cursor-pointer"
            >
              <UploadCloud size={16} />
              Nhập hàng (PO)
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-2xl border border-sidebar-accent">
        {!isStoreManager && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Chi nhánh</span>
            <select
              value={branchFilter}
              onChange={e => { setBranchFilter(e.target.value); setVariantFilter("ALL"); setPage(1); }}
              className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent min-w-[160px]"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Loại hàng</span>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setVariantFilter("ALL"); setPage(1); }}
            className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent min-w-[160px]"
          >
            <option value="ALL">Tất cả loại hàng</option>
            <option value="PRODUCT">Sản phẩm</option>
            <option value="INGREDIENT">Nguyên liệu</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mặt hàng</span>
          <select
            value={variantFilter}
            onChange={e => { setVariantFilter(e.target.value); setPage(1); }}
            className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent min-w-[200px]"
          >
            <option value="ALL">Tất cả mặt hàng</option>
            {uniqueVariants.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Tổng SKU", String(totalSKU), `${new Set(filteredStocks.map(s => s.branchId)).size} chi nhánh`],
          ["Sắp hết hàng", String(lowStock), "Cần nhập hàng sớm"],
          ["Hết hàng", String(outOfStock), "Ẩn khỏi menu bán hàng"],
        ].map(([label, value, sub], index) => (
          <div key={label} className="rounded-2xl bg-sidebar p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Boxes size={17} className={index === 0 ? "text-primary" : index === 1 ? "text-yellow-400" : "text-red-400"} />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* PR (Purchase Request) List Section */}
      {prs.length > 0 && (
        <div className="rounded-2xl bg-sidebar p-5 border border-sidebar-accent space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="text-primary" size={18} />
            Phiếu Yêu cầu Đặt hàng (PR) từ chi nhánh ({prs.length})
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sidebar-accent text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Mã PR</th>
                  <th className="pb-2 pr-4">Chi nhánh</th>
                  <th className="pb-2 pr-4">Người đề xuất</th>
                  <th className="pb-2 pr-4">Mặt hàng cần nhập</th>
                  <th className="pb-2 pr-4">Trạng thái</th>
                  <th className="pb-2 pr-4">Thời gian</th>
                  <th className="pb-2">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {prs.map((pr: any) => (
                  <tr key={pr.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent/50 transition">
                    <td className="py-2.5 pr-4 font-mono font-bold text-primary">{pr.prCode}</td>
                    <td className="py-2.5 pr-4 text-foreground font-medium">{pr.branch?.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">{pr.requestedBy?.fullName || "Quản lý"}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground max-w-[280px]">
                      {pr.items?.map((it: any) => (
                        <div key={it.id}>
                          • {it.ingredient ? it.ingredient.name : it.variant?.product?.name}: <strong>{it.requestedQuantity}</strong> {it.ingredient?.unit || "Cái"}
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pr.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-500' :
                        pr.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {pr.status === 'PENDING_APPROVAL' ? 'Chờ Admin duyệt' : pr.status === 'APPROVED' ? 'Đã duyệt (PO)' : pr.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{new Date(pr.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-2.5">
                      {isAdmin && pr.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePr(pr.id)}
                            className="rounded bg-primary hover:bg-primary/80 text-white px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                          >
                            Duyệt PR & Sinh PO
                          </button>
                          <button
                            onClick={() => handleCancelPr(pr.id)}
                            className="rounded bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && adjustments.length > 0 && (
        <div className="rounded-2xl bg-sidebar p-5 border border-sidebar-accent space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="text-yellow-400" size={18} />
            Yêu cầu thay đổi hàng hóa đang chờ duyệt ({adjustments.length})
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sidebar-accent text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Chi nhánh</th>
                  <th className="pb-2 pr-4">Sản phẩm</th>
                  <th className="pb-2 pr-4">Tồn hiện tại</th>
                  <th className="pb-2 pr-4">Tồn đề xuất</th>
                  <th className="pb-2 pr-4">Tối thiểu hiện tại</th>
                  <th className="pb-2 pr-4">Tối thiểu đề xuất</th>
                  <th className="pb-2 pr-4">Người đề xuất</th>
                  <th className="pb-2 pr-4">Lý do</th>
                  <th className="pb-2 pr-4">Minh chứng</th>
                  <th className="pb-2 pr-4">Thời gian</th>
                  <th className="pb-2">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((req) => (
                  <tr key={req.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent/50 transition">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{req.branch?.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {req.ingredientId ? (
                        <span className="font-semibold text-foreground">Nguyên liệu: {req.ingredient?.name}</span>
                      ) : (
                        <span>{req.variant?.product?.name} ({req.variant?.variantName || "Mặc định"})</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {Math.round(req.currentQuantity)}{req.ingredientId ? (req.ingredient?.unit || "g") : " Cái"}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-primary">
                      {Math.round(req.requestedQuantity)}{req.ingredientId ? (req.ingredient?.unit || "g") : " Cái"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {Math.round(req.currentMinQuantity)}{req.ingredientId ? (req.ingredient?.unit || "g") : " Cái"}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-primary">
                      {Math.round(req.requestedMinQuantity)}{req.ingredientId ? (req.ingredient?.unit || "g") : " Cái"}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{req.requestedBy?.fullName || "Quản lý"}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground max-w-[150px] truncate" title={req.reason}>
                      {req.reason || <span className="text-muted-foreground/50">N/A</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      <div className="flex gap-1 items-center">
                        {(() => {
                          const imagesList = req.imageUrl ? req.imageUrl.split(',') : [];
                          if (imagesList.length === 0) return <span className="text-muted-foreground/50">N/A</span>;
                          return (
                            <>
                              <button
                                onClick={() => {
                                  setLightboxImages(imagesList);
                                  setLightboxIndex(0);
                                }}
                                className="inline-block size-8 rounded-lg overflow-hidden border border-sidebar-accent hover:opacity-80 transition cursor-zoom-in bg-sidebar-accent focus:outline-none shrink-0"
                                title="Click để phóng to ảnh"
                              >
                                <img src={imagesList[0]} alt="Proof" className="w-full h-full object-cover" />
                              </button>
                              {imagesList.length > 1 && (
                                <button
                                  onClick={() => {
                                    setLightboxImages(imagesList);
                                    setLightboxIndex(1);
                                  }}
                                  className="inline-flex size-8 rounded-lg overflow-hidden border border-sidebar-accent bg-sidebar-accent hover:bg-sidebar-accent/80 transition items-center justify-center text-[10px] font-bold text-foreground cursor-zoom-in focus:outline-none shrink-0"
                                  title="Xem toàn bộ ảnh"
                                >
                                  +{imagesList.length - 1}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="rounded bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs font-semibold transition cursor-pointer"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="rounded bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs font-semibold transition cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={mainTableHeaders} />
          <tbody>
            {paginatedStocks.map(row => {
              const displayQty = row.isIngredient
                ? Number(row.quantity)
                : row.maxSellableQuantity !== null && row.maxSellableQuantity !== undefined
                ? Number(row.maxSellableQuantity)
                : Number(row.quantity);
              const minVal = row.isIngredient ? Number(row.minStockLevel || 0) : Number(row.minQuantity || 0);
              const status = getStatus(displayQty, minVal);
              return (
                <tr key={row.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  {!isStoreManager && <td className="py-3 font-medium text-foreground">{row.branch?.name || "N/A"}</td>}
                  <td className="py-3 text-muted-foreground">
                    {row.isIngredient ? (
                      <span className="font-semibold text-foreground">{row.ingredient?.name}</span>
                    ) : (
                      <span>{row.variant?.product?.name} ({row.variant?.variantName || "Mặc định"})</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-xs text-primary">
                    {row.isIngredient ? (row.ingredient?.code || "N/A") : (row.variant?.sku || "N/A")}
                  </td>
                  <td className="py-3 font-semibold text-foreground">
                    <div>
                      {row.isIngredient ? (
                        <span>{Math.round(Number(row.quantity))}{row.ingredient?.unit || "g"}</span>
                      ) : (
                        <span>
                          {row.maxSellableQuantity !== null && row.maxSellableQuantity !== undefined
                            ? `${Math.round(Number(row.maxSellableQuantity))} Cái`
                            : `${Math.round(Number(row.quantity))} Cái`
                          }
                        </span>
                      )}
                    </div>
                    {row.pendingAdjustment && (
                      <div className="text-[10px] text-amber-500 font-normal mt-0.5 whitespace-nowrap">
                        (Chờ duyệt: {Math.round(Number(row.pendingAdjustment.requestedQuantity))}{row.isIngredient ? (row.ingredient?.unit || "g") : " Cái"})
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    <div>
                      {row.isIngredient ? (
                        <span>{Math.round(Number(row.minStockLevel || 0))}{row.ingredient?.unit || "g"}</span>
                      ) : (
                        <span>{Math.round(Number(row.minQuantity || 0))} Cái</span>
                      )}
                    </div>
                    {row.pendingAdjustment && Number(row.pendingAdjustment.requestedMinQuantity) !== minVal && (
                      <div className="text-[10px] text-amber-500 font-normal mt-0.5 whitespace-nowrap">
                        (Chờ duyệt: {Math.round(Number(row.pendingAdjustment.requestedMinQuantity))}{row.isIngredient ? (row.ingredient?.unit || "g") : " Cái"})
                      </div>
                    )}
                  </td>
                  <td className="py-3"><StatusBadge status={status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleViewBatches(row)}
                        title="Xem chi tiết lô hàng (FIFO)"
                        className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                      {isStoreManager && (
                        <button
                          onClick={() => handleEdit(row)}
                          title="Điều chỉnh tồn kho"
                          className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan={isStoreManager ? 6 : 7} className="py-8 text-center text-muted-foreground">
                  Không có dữ liệu tồn kho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-sidebar-accent pt-4">
            <span className="text-xs text-muted-foreground">
              Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredStocks.length)} trong {filteredStocks.length}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50">Trước</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>

      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-sidebar-accent bg-sidebar p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Điều chỉnh tồn kho</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Chi nhánh: {editingStock.branch?.name} - {editingStock.isIngredient ? `Nguyên liệu: ${editingStock.ingredient?.name}` : `Biến thể: ${editingStock.variant?.product?.name} (${editingStock.variant?.variantName || "Mặc định"})`}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Số lượng tồn kho</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formQuantity}
                  onChange={e => setFormQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Cảnh báo tối thiểu</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formMinQuantity}
                  onChange={e => setFormMinQuantity(e.target.value)}
                />
              </div>
              {isStoreManager && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Lý do điều chỉnh</label>
                    <textarea
                      placeholder="Nhập lý do thực tế (ví dụ: Hao hụt nguyên liệu, hư hỏng...)"
                      rows={2}
                      className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent text-sm resize-none"
                      value={formReason}
                      onChange={e => setFormReason(e.target.value)}
                    />
                  </div>
                  <div>
                    <MultiImageUploader
                      label="Ảnh minh chứng thực tế (Có thể tải lên nhiều ảnh)"
                      values={formImages}
                      onChange={urls => setFormImages(urls)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingStock(null)}
                className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInboundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-sidebar-accent bg-sidebar p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Nhập kho hàng hóa từ PO</h3>
              <button
                onClick={() => {
                  setShowInboundModal(false);
                  setActivePO(null);
                  setPoCodeInput("");
                }}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            {!activePO ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Quét mã vạch hoặc nhập mã phiếu đặt hàng (Purchase Order Code - ví dụ: PO-HN01-20260722) để kiểm kê thực tế và nhập kho.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã phiếu PO (ví dụ: PO-HN01-20260722)"
                    value={poCodeInput}
                    onChange={(e) => setPoCodeInput(e.target.value)}
                    className="flex-1 rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleScanPO();
                    }}
                  />
                  <button
                    onClick={handleScanPO}
                    disabled={scanningPO}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {scanningPO ? <Loader2 className="animate-spin" size={14} /> : null}
                    Quét/Tìm
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-sidebar-accent/50 p-4 border border-sidebar-accent grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Mã PO: </span>
                    <strong className="text-foreground">{activePO.po_code}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nhà cung cấp: </span>
                    <strong className="text-foreground">{activePO.supplier?.name || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trạng thái: </span>
                    <strong className="text-foreground">{activePO.status}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hạn chót SLA: </span>
                    <strong className="text-amber-500 font-mono">
                      {activePO.expired_at ? new Date(activePO.expired_at).toLocaleDateString("vi-VN") : "7 ngày từ giao hàng"}
                    </strong>
                  </div>
                </div>

                {/* Item Barcode / SKU Scan counter */}
                <div className="flex gap-2 items-center bg-sidebar-accent/30 p-2.5 rounded-xl border border-sidebar-accent">
                  <Search size={16} className="text-primary" />
                  <input
                    type="text"
                    placeholder="Bắn/Quét Barcode hoặc SKU thùng/hộp để tự động cộng dồn số lượng thực nhận..."
                    value={itemBarcodeScanInput}
                    onChange={(e) => setItemBarcodeScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!itemBarcodeScanInput.trim()) return;
                        const code = itemBarcodeScanInput.trim().toLowerCase();
                        const foundIdx = inboundItems.findIndex((it: any) =>
                          (it.barcode && it.barcode.toLowerCase() === code) ||
                          (it.name && it.name.toLowerCase().includes(code))
                        );
                        if (foundIdx !== -1) {
                          const updated = [...inboundItems];
                          updated[foundIdx].receivedQuantity = Number(updated[foundIdx].receivedQuantity || 0) + 1;
                          setInboundItems(updated);
                          toast.success(`Đã quét +1 cho: ${updated[foundIdx].name}`);
                          setItemBarcodeScanInput("");
                        } else {
                          toast.error(`Mã vạch/SKU '${itemBarcodeScanInput}' không thuộc sản phẩm nào trong PO này.`);
                        }
                      }
                    }}
                    className="flex-1 bg-transparent text-xs text-foreground outline-none font-mono"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
                  {inboundItems.map((item, idx) => (
                    <div key={item.poItemId} className="p-4 rounded-xl border border-sidebar-accent bg-sidebar-accent/20 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                          {item.barcode && <p className="text-[10px] text-muted-foreground font-mono">Barcode: {item.barcode}</p>}
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                          Yêu cầu: {item.orderedQuantity} {item.unit}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-muted-foreground mb-1 font-medium">Phân loại hàng</label>
                          <select
                            value={item.isIngredient ? "INGREDIENT" : "PRODUCT"}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              const isIng = e.target.value === "INGREDIENT";
                              updated[idx].isIngredient = isIng;
                              updated[idx].unit = isIng ? "kg" : "Cái";
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-foreground border border-sidebar-accent outline-none font-medium"
                          >
                            <option value="INGREDIENT">Nguyên liệu</option>
                            <option value="PRODUCT">Sản phẩm</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1 font-medium">Đơn vị nhận hàng</label>
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].unit = e.target.value;
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-foreground border border-sidebar-accent outline-none font-medium"
                          >
                            {item.isIngredient ? (
                              <>
                                <option value="kg">kg (Kilôgam)</option>
                                <option value="g">g (Gam)</option>
                                <option value="l">l (Lít)</option>
                                <option value="ml">ml (Mililít)</option>
                                <option value="Cái">Cái</option>
                              </>
                            ) : (
                              <>
                                <option value="Cái">Cái</option>
                                <option value="Hộp">Hộp</option>
                                <option value="Chai">Chai</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1 font-medium">Số lượng thực nhận</label>
                          <input
                            type="number"
                            min="0"
                            value={item.receivedQuantity}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].receivedQuantity = e.target.value;
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-foreground border border-sidebar-accent outline-none font-semibold text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-red-400 mb-1 font-medium">Số lượng bị hỏng/từ chối</label>
                          <input
                            type="number"
                            min="0"
                            value={item.rejectedQuantity || 0}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].rejectedQuantity = e.target.value;
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-red-400 border border-red-500/30 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1">Mã lô nhập kho (Batch Code)</label>
                          <input
                            type="text"
                            placeholder="Mặc định tự động"
                            value={item.batchCode}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].batchCode = e.target.value;
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-foreground border border-sidebar-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1">Ngày hết hạn (Hạn dùng)</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => {
                              const updated = [...inboundItems];
                              updated[idx].expiryDate = e.target.value;
                              setInboundItems(updated);
                            }}
                            className="w-full rounded-lg bg-sidebar px-2 py-1.5 text-foreground border border-sidebar-accent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setActivePO(null)}
                    className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirmInbound}
                    disabled={confirmingInbound}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {confirmingInbound ? <Loader2 className="animate-spin" size={14} /> : null}
                    Xác nhận nhập kho
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPrModal && (() => {
        const activeBranchId = currentUser?.branchId || (branchFilter !== "ALL" ? branchFilter : undefined);
        const branchStocks = stocks.filter(s => !activeBranchId || s.branchId === activeBranchId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-3xl rounded-3xl border border-sidebar-accent bg-sidebar p-6 md:p-8 shadow-2xl space-y-5 my-8">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-sidebar-accent pb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="text-primary" size={22} />
                    Tạo Phiếu Yêu cầu Đặt hàng (PR)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lập danh sách nguyên liệu/sản phẩm thiếu để gửi Admin duyệt & tự động sinh đơn hàng PO với nhà cung cấp.
                  </p>
                </div>
                <button
                  onClick={() => setShowPrModal(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent p-2 rounded-full transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Stock Legend Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-sidebar-accent/30 p-3 rounded-2xl border border-sidebar-accent/60 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Boxes size={15} className="text-primary" /> Hướng dẫn màu sắc tồn kho:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-medium text-[11px]">
                    🔴 Chạm / Dưới tối thiểu
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium text-[11px]">
                    🟡 Gần chạm tối thiểu
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium text-[11px]">
                    🟢 Tồn kho an toàn
                  </span>
                </div>
              </div>

              <div className="space-y-5 text-xs">
                {/* Note Field */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Ghi chú gửi Ban Quản Lý (Admin)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nhập lý do cần nhập hàng khẩn cấp (ví dụ: Nguyên liệu pha chế sắp hết trong ngày, bánh ngọt sắp hết kho...)"
                    value={prNote}
                    onChange={(e) => setPrNote(e.target.value)}
                    className="w-full rounded-2xl bg-sidebar-accent/50 px-4 py-2.5 text-foreground outline-none border border-sidebar-accent focus:border-primary text-xs resize-none transition"
                  />
                </div>

                {/* Items Section Header */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-sidebar-accent pb-2">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      Danh sách mặt hàng đặt ({prItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrItems([...prItems, { ingredientId: "", variantId: "", requestedQuantity: "10", note: "" }])}
                      className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <Plus size={14} /> Thêm dòng mặt hàng
                    </button>
                  </div>

                  {/* List of Item Cards */}
                  <div className="max-h-80 overflow-y-auto space-y-3.5 pr-1">
                    {prItems.map((item, idx) => {
                      const selectedStock = branchStocks.find(s =>
                        (item.ingredientId && s.isIngredient && s.ingredient?.id === item.ingredientId) ||
                        (item.variantId && !s.isIngredient && s.variant?.id === item.variantId)
                      );
                      const st = getStockStatus(selectedStock);
                      const selectedUnit = selectedStock?.isIngredient ? selectedStock.ingredient?.unit : "cái";

                      return (
                        <div key={idx} className="rounded-2xl border border-sidebar-accent bg-sidebar-accent/20 p-4 shadow-sm space-y-3 transition hover:border-primary/40">
                          
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-sidebar-accent/40 pb-2">
                            <span className="font-bold text-xs text-foreground/80 flex items-center gap-2">
                              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              Mặt hàng #{idx + 1}
                            </span>

                            <div className="flex items-center gap-2">
                              {selectedStock && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${st.bgBadge}`}>
                                  <span>{st.emoji}</span>
                                  <span>Tồn: <strong className="font-bold">{st.qty}</strong> {selectedUnit}</span>
                                  <span className="opacity-40">|</span>
                                  <span>Min: <strong>{st.min}</strong> {selectedUnit}</span>
                                </span>
                              )}

                              {prItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setPrItems(prItems.filter((_, i) => i !== idx))}
                                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition cursor-pointer"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Form Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                Chọn Nguyên liệu / Sản phẩm
                              </label>
                              <select
                                value={item.ingredientId ? `ING:${item.ingredientId}` : item.variantId ? `VAR:${item.variantId}` : ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...prItems];
                                  if (val.startsWith("ING:")) {
                                    updated[idx].ingredientId = val.replace("ING:", "");
                                    updated[idx].variantId = "";
                                  } else if (val.startsWith("VAR:")) {
                                    updated[idx].variantId = val.replace("VAR:", "");
                                    updated[idx].ingredientId = "";
                                  } else {
                                    updated[idx].ingredientId = "";
                                    updated[idx].variantId = "";
                                  }
                                  setPrItems(updated);
                                }}
                                className="w-full rounded-xl bg-sidebar px-3 py-2 text-xs text-foreground outline-none border border-sidebar-accent focus:border-primary font-medium"
                              >
                                <option value="">-- Click chọn Nguyên liệu / Sản phẩm --</option>
                                <optgroup label="🧪 NGUYÊN LIỆU (PHA CHẾ / CHẾ BIẾN)">
                                  {branchStocks.filter(s => s.isIngredient && s.ingredient).map(s => {
                                    const itemSt = getStockStatus(s);
                                    const unit = s.ingredient.unit ? ` ${s.ingredient.unit}` : "";
                                    return (
                                      <option key={`ING:${s.ingredient.id}`} value={`ING:${s.ingredient.id}`}>
                                        {itemSt.emoji} {s.ingredient.name} — [Tồn: {itemSt.qty}{unit} | Min: {itemSt.min}{unit}]
                                      </option>
                                    );
                                  })}
                                </optgroup>
                                <optgroup label="📦 SẢN PHẨM BÁN LẺ / BÁNH">
                                  {branchStocks.filter(s => !s.isIngredient && s.variant).map(s => {
                                    const itemSt = getStockStatus(s);
                                    const vName = s.variant.variantName === "Biến thể mặc định" ? "" : ` (${s.variant.variantName})`;
                                    const fullName = `${s.variant.product?.name || ''}${vName}`;
                                    return (
                                      <option key={`VAR:${s.variant.id}`} value={`VAR:${s.variant.id}`}>
                                        {itemSt.emoji} {fullName} — [Tồn: {itemSt.qty} | Min: {itemSt.min}]
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                Số lượng cần đặt
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.1"
                                  placeholder="Số lượng"
                                  value={item.requestedQuantity}
                                  onChange={(e) => {
                                    const updated = [...prItems];
                                    updated[idx].requestedQuantity = e.target.value;
                                    setPrItems(updated);
                                  }}
                                  className="w-full rounded-xl bg-sidebar px-3 py-2 pr-12 text-xs text-foreground outline-none border border-sidebar-accent focus:border-primary font-bold text-primary"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase bg-sidebar-accent px-1.5 py-0.5 rounded">
                                  {selectedUnit}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-sidebar-accent">
                <button
                  type="button"
                  onClick={() => setShowPrModal(false)}
                  className="rounded-full border border-sidebar-accent px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleCreatePr}
                  disabled={submittingPr}
                  className="rounded-full bg-primary hover:bg-primary/80 px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-md disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
                >
                  {submittingPr ? <Loader2 className="animate-spin" size={15} /> : null}
                  Gửi Yêu cầu (PR)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedStockForBatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-sidebar-accent bg-sidebar p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-foreground">Chi tiết lô hàng trong kho</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Chi nhánh: <strong>{selectedStockForBatches.branch?.name}</strong> | 
                  {selectedStockForBatches.isIngredient ? (
                    <>Nguyên liệu: <strong>{selectedStockForBatches.ingredient?.name}</strong></>
                  ) : (
                    <>Biến thể: <strong>{selectedStockForBatches.variant?.product?.name} ({selectedStockForBatches.variant?.variantName || "Mặc định"})</strong></>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedStockForBatches(null);
                  setBatchesList([]);
                }}
                className="text-muted-foreground hover:text-foreground text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingBatches ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <Clock size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Danh sách các lô hàng đang được sắp xếp theo <strong>thứ tự nhập kho (FIFO - Nhập trước xuất trước)</strong>. 
                    Lô hàng trên cùng có số lượng lớn hơn 0 (tô màu xanh) sẽ là lô được ưu tiên xuất kho trước khi bán sản phẩm.
                  </span>
                </div>

                <div className="overflow-auto max-h-96">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-sidebar-accent text-muted-foreground uppercase tracking-wider text-[10px]">
                        <th className="pb-2 pr-2">Mã lô (Batch Code)</th>
                        <th className="pb-2 pr-2">Ngày nhập kho (FIFO)</th>
                        <th className="pb-2 pr-2">Ngày sản xuất</th>
                        <th className="pb-2 pr-2">Hạn sử dụng</th>
                        <th className="pb-2 text-right pr-2">SL ban đầu</th>
                        <th className="pb-2 text-right pr-2">SL hiện tại</th>
                        <th className="pb-2 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchesList.map((batch, index) => {
                        const isFirstActive = batchesList.findIndex(b => Number(b.quantity) > 0) === index;
                        return (
                          <tr key={batch.id} className={`border-t border-sidebar-accent hover:bg-sidebar-accent/30 transition ${isFirstActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                            <td className="py-2.5 pr-2 font-medium text-foreground">
                              <div className="flex items-center gap-1.5">
                                {batch.batchCode}
                                {isFirstActive && (
                                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                    Ưu tiên xuất
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 pr-2 text-muted-foreground">
                              {batch.receivedDate ? new Date(batch.receivedDate).toLocaleString("vi-VN") : "N/A"}
                            </td>
                            <td className="py-2.5 pr-2 text-muted-foreground">
                              {batch.manufactureDate ? new Date(batch.manufactureDate).toLocaleDateString("vi-VN") : "N/A"}
                            </td>
                            <td className="py-2.5 pr-2 text-muted-foreground font-medium">
                              {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString("vi-VN") : "N/A"}
                            </td>
                            <td className="py-2.5 text-right pr-2 text-muted-foreground">{Number(batch.initialQuantity)}</td>
                            <td className="py-2.5 text-right pr-2 font-semibold text-foreground">{Number(batch.quantity)}</td>
                            <td className="py-2.5 text-center">
                              <StatusBadge status={batch.status === 'ACTIVE' ? 'Đang hoạt động' : batch.status === 'EXPIRED' ? 'Hết hạn' : 'Hết hàng'} />
                            </td>
                          </tr>
                        );
                      })}
                      {batchesList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            Không có thông tin lô hàng nào trong kho.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSelectedStockForBatches(null);
                      setBatchesList([]);
                    }}
                    className="rounded-full bg-secondary hover:bg-secondary/80 text-foreground px-5 py-2 text-sm font-semibold transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
          <button
            onClick={() => setLightboxImages([])}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition cursor-pointer z-30"
          >
            ✕
          </button>

          {lightboxImages.length > 1 && (
            <button
              onClick={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white hover:text-primary bg-black/60 hover:bg-black/80 p-4 rounded-full transition cursor-pointer text-xl font-bold flex items-center justify-center size-12"
            >
              ◀
            </button>
          )}

          <div className="relative max-w-4xl max-h-[80vh] flex items-center justify-center z-20">
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Lightbox"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {lightboxImages.length > 1 && (
            <button
              onClick={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white hover:text-primary bg-black/60 hover:bg-black/80 p-4 rounded-full transition cursor-pointer text-xl font-bold flex items-center justify-center size-12"
            >
              ▶
            </button>
          )}
          
          {lightboxImages.length > 1 && (
            <p className="text-white/60 text-sm mt-4 font-semibold z-20">
              Ảnh {lightboxIndex + 1} / {lightboxImages.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MultiImageUploader({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [...values];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Kích thước file ${file.name} vượt quá 5MB.`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from("cakeandcoffee")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("cakeandcoffee")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
      onChange(uploadedUrls);
      toast.success("Tải các ảnh lên thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = values.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-muted-foreground block">{label}</label>
      <div className="flex flex-wrap gap-3">
        {values.map((url, idx) => (
          <div key={idx} className="relative size-16 rounded-xl border border-sidebar-accent overflow-hidden shrink-0 group">
            <img src={url} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200 text-xs font-semibold cursor-pointer"
            >
              Xóa
            </button>
          </div>
        ))}
        <label className="size-16 rounded-xl border-2 border-dashed border-sidebar-accent flex flex-col items-center justify-center cursor-pointer hover:bg-sidebar-accent/50 transition">
          {uploading ? (
            <Loader2 className="animate-spin text-primary" size={20} />
          ) : (
            <>
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mt-1 font-medium">Thêm ảnh</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}


