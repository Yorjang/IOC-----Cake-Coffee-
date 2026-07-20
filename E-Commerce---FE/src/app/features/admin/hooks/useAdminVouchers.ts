import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAccessToken } from "../../../components/authSession";
import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";

export function useAdminVouchers() {

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

  const loadCoupons = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
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
      if (res.ok) setCategories(await parseRes(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadSizesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/sizes/distinct`);
      if (res.ok) setAvailableSizes(await parseRes(res));
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
          isActive: true,
        }),
      });
      const data = await parseRes(res);
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
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi xóa.");
      }

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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
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
      if (res.ok) setCategories(await parseRes(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadSizesOnly = async () => {
    try {
      const res = await fetch(`${env.API_URL}/products/sizes/distinct`);
      if (res.ok) setAvailableSizes(await parseRes(res));
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
          isActive: true,
        }),
      });
      const data = await parseRes(res);
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
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return {
    coupons,
    products,
    categories,
    loading,
    code, setCode,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
    minOrderValue, setMinOrderValue,
    usageLimit, setUsageLimit,
    expiresAt, setExpiresAt,
    productId, setProductId,
    categoriesId, setCategoriesId,
    editingVoucher, setEditingVoucher,
    saving, setSaving,
    maxDiscount, setMaxDiscount,
    targetSize, setTargetSize,
    description, setDescription,
    availableSizes, setAvailableSizes,
    loadCoupons,
    loadProductsOnly,
    loadCategoriesOnly,
    loadSizesOnly,
    handleSave,
    handleStartEdit,
    handleCancelEdit,
    getFilteredSizes,
    handleDelete,
    formatMoney
  };
}
