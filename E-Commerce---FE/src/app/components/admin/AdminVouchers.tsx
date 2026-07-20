
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { StatusBadge, TableHeader } from "./AdminShared";

export function AdminVouchers() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [productId, setProductId] = useState("");
  const [categoriesId, setCategoriesId] = useState("");
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [description, setDescription] = useState("");
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const loadCoupons = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(data);
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
      if (pRes.ok) setProducts(await pRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategoriesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadSizesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/sizes/distinct`);
      if (res.ok) setAvailableSizes(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadProductsOnly();
    loadCategoriesOnly();
    loadSizesOnly();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiresAt) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    setSaving(true);
    try {
      const isEditing = !!editingVoucher;
      const url = isEditing ? `${env.API_URL}/coupons/${editingVoucher.id}` : `${env.API_URL}/coupons`;
      const method = isEditing ? "PATCH" : "POST";

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
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          startsAt: new Date(),
          expiresAt: new Date(expiresAt),
          productId: productId || null,
          categoriesId: categoriesId || null,
          targetSize: targetSize || null,
          description: description || "",
          isActive: isActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEditing ? "Cập nhật voucher thành công." : "Tạo voucher thành công.");
        // Clear form
        setCode("");
        setDiscountValue("");
        setMinOrderValue("");
        setMaxDiscount("");
        setUsageLimit("");
        setExpiresAt("");
        setProductId("");
        setCategoriesId("");
        setTargetSize("");
        setDescription("");
        setIsActive(true);
        setEditingVoucher(null);
        loadCoupons();
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
    setCode(v.code);
    setDiscountType(v.discountType);
    setDiscountValue(String(Math.round(Number(v.discountValue))));
    setMinOrderValue(String(v.minOrderValue));
    setMaxDiscount(v.maxDiscount ? String(v.maxDiscount) : "");
    setUsageLimit(v.usageLimit ? String(v.usageLimit) : "");
    const dateStr = v.expiresAt ? new Date(v.expiresAt).toISOString().split('T')[0] : "";
    setExpiresAt(dateStr);
    setProductId(v.productId || "");
    setCategoriesId(v.categoriesId || "");
    setTargetSize(v.targetSize || "");
    setDescription(v.description || "");
    setIsActive(v.isActive !== false);
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinOrderValue("");
    setMaxDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setProductId("");
    setCategoriesId("");
    setTargetSize("");
    setDescription("");
    setIsActive(true);
  };

  const getFilteredSizes = () => {
    if (!productId) return availableSizes;
    const selProd = products.find(p => p.id === productId);
    if (!selProd || !selProd.variants) return [];
    const sizes = selProd.variants.map((v: any) => v.size).filter(Boolean);
    return Array.from(new Set(sizes.map((s: string) => s.trim()))) as string[];
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này không?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa voucher thành công.");
        loadCoupons();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý voucher</h2>
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã", "Sản phẩm", "Kiểu", "Giá trị", "Giảm tối đa", "Đơn tối thiểu", "Đã dùng / Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
          <tbody>
            {coupons.map(v => {
              const hasLimit = v.usageLimit !== null;
              const usedRatio = hasLimit ? (v.usedCount / v.usageLimit) * 100 : 0;
              const isExpired = new Date(v.expiresAt) < new Date();
              const status = isExpired ? "Hết hạn" : (v.isActive ? "Hoạt động" : "Tạm khóa");

              return (
                <tr key={v.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-mono font-bold text-primary">{v.code}</td>
                  <td className="py-3">
                    {v.productId && v.product ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-500 font-semibold">
                        🛍 {v.product.name}
                      </span>
                    ) : v.categoriesId && v.category ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs text-purple-500 font-semibold">
                        🏷 {v.category.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Tất cả sản phẩm</span>
                    )}
                    {v.targetSize && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-500 font-semibold ml-1">
                        📐 Size: {v.targetSize}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {v.discountType === "percent" ? "Phần trăm" : "Cố định"}
                  </td>
                  <td className="py-3 font-semibold text-foreground">
                    {v.discountType === "percent" ? `${Math.round(Number(v.discountValue))}%` : formatMoney(Number(v.discountValue))}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {v.maxDiscount && Number(v.maxDiscount) > 0 ? formatMoney(Number(v.maxDiscount)) : "-"}
                  </td>
                  <td className="py-3 text-muted-foreground">{formatMoney(Number(v.minOrderValue))}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-sidebar-accent overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(usedRatio, 100)}%` }} />
                      </div>
                      <span className="text-muted-foreground text-xs">
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
            {coupons.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy voucher nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSave} className="rounded-2xl bg-sidebar p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {editingVoucher ? `Chỉnh sửa voucher: ${editingVoucher.code}` : "Tạo voucher mới"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            required
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
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
          {discountType === "percent" && (
            <input
              type="number"
              className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent"
              placeholder="Giảm tối đa (đ) - Để trống nếu không giới hạn"
              value={maxDiscount}
              onChange={e => setMaxDiscount(e.target.value)}
            />
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
                const selProd = products.find(p => p.id === val);
                if (selProd && selProd.variants) {
                  const sizes = selProd.variants.map((v: any) => v.size || "");
                  const exists = sizes.some((s: string) => s.trim() === targetSize);
                  if (!exists) setTargetSize("");
                }
              }
            }}
          >
            <option value="">Sản phẩm: Tất cả</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                🛍 {p.name} ({p.category?.name || 'Khác'})
              </option>
            ))}
          </select>
          <select
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
            value={categoriesId}
            onChange={e => { setCategoriesId(e.target.value); if (e.target.value) setProductId(""); }}
          >
            <option value="">Danh mục: Tất cả</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                🏷 {c.name}
              </option>
            ))}
          </select>
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
          <input
            className="rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-sidebar-accent sm:col-span-2 lg:col-span-3"
            placeholder="Mô tả voucher (VD: Giảm giá 20k cho sản phẩm size Lớn)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
            {editingVoucher && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-sidebar-accent px-6 py-2 text-sm text-muted-foreground hover:bg-sidebar transition"
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition"
            >
              {saving ? "Đang lưu..." : (editingVoucher ? "Cập nhật" : "Tạo voucher")}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
