import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";
import { getAccessToken, getStoredUser } from "../../../components/authSession";

const DRINK_TYPES = ["coffee", "drink"];

export function useAdminProducts() {
  const user = getStoredUser();
  const isManager = user?.role === "store_manager";
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", description: "", imageUrl: "", productType: "cake", branchId: isManager ? user?.branchId || "" : "" });
  const [variantForms, setVariantForms] = useState<any[]>([]);
  const [toppingForms, setToppingForms] = useState<any[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  // BOM: ingredient recipe per variant
  const [ingredients, setIngredients] = useState<any[]>([]);
  // variantRecipes: { [tempKey: string]: { ingredientId: string; quantityRequired: number; unit?: string }[] }
  const [variantRecipes, setVariantRecipes] = useState<Record<string, any[]>>({});

  const getToken = () => getAccessToken();

  const load = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [pRes, cRes, bRes, iRes] = await Promise.all([
        fetch(`${env.API_URL}/products`, { headers }),
        fetch(`${env.API_URL}/products/categories`),
        fetch(`${env.API_URL}/branches/active`),
        fetch(`${env.API_URL}/inventory/ingredients?isActive=true`, { headers }),
      ]);
      if (pRes.ok) setItems(await parseRes(pRes));
      if (cRes.ok) setCats(await parseRes(cRes));
      if (bRes.ok) setBranches(await parseRes(bRes));
      if (iRes.ok) { const iData = await parseRes(iRes); setIngredients(Array.isArray(iData) ? iData : (iData?.data ?? [])); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const emptyVariant = (name = "") => ({
    sku: `${name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "PRODUCT"}-${Date.now().toString().slice(-6)}`,
    variantName: name ? `${name} - Mặc định` : "Biến thể mặc định",
    size: "Mặc định",
    flavor: "",
    topping: "",
    price: "45000",
    status: "active",
    imageUrl: "",
  });

  const emptyTopping = () => ({ name: "", price: "0", isActive: true });

  const loadVariantRecipes = useCallback(async (variants: any[], productType: string) => {
    if (!DRINK_TYPES.includes(productType)) return;
    const token = getToken();
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const recipes: Record<string, any[]> = {};
    await Promise.all(
      variants
        .filter((v: any) => v.id)
        .map(async (v: any) => {
          try {
            const res = await fetch(`${env.API_URL}/inventory/variants/${v.id}/ingredients`, { headers });
            if (res.ok) {
              const data = await parseRes(res);
              recipes[v.id] = (Array.isArray(data) ? data : (data?.data ?? [])).map((r: any) => ({
                ingredientId: r.ingredientId,
                quantityRequired: Number(r.quantityRequired),
                unit: r.unit ?? 'g',
              }));
            } else {
              recipes[v.id] = [];
            }
          } catch { recipes[v.id] = []; }
        })
    );
    setVariantRecipes(recipes);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", categoryId: cats[0]?.id ?? "", description: "", imageUrl: "", productType: "cake", branchId: isManager ? user?.branchId || "" : "" });
    setVariantForms([emptyVariant()]);
    setToppingForms([]);
    setRemovedVariantIds([]);
    setVariantRecipes({});
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId, description: p.description || "", imageUrl: p.imageUrl || "", productType: p.productType, branchId: p.branchId || (isManager ? user?.branchId || "" : "") });
    const mappedVariants = (p.variants || []).map((variant: any) => ({
      ...variant,
      price: String(variant.price),
      flavor: variant.flavor || "",
      topping: variant.topping || "",
      imageUrl: variant.imageUrl || "",
    }));
    setVariantForms(mappedVariants);
    setToppingForms([...(p.toppings || [])]
      .sort((a: any, b: any) => Number(a.sortOrder) - Number(b.sortOrder))
      .map((topping: any) => ({ ...topping, price: String(topping.price) })));
    setRemovedVariantIds([]);
    setVariantRecipes({});
    setShowModal(true);
    // Load recipe for each variant asynchronously
    loadVariantRecipes(p.variants || [], p.productType);
  };

  const updateVariantForm = (index: number, changes: any) => {
    setVariantForms(current => current.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, ...changes } : variant,
    ));
  };

  const removeVariantForm = (index: number) => {
    if (variantForms.length <= 1) {
      toast.error("Sản phẩm phải có ít nhất một biến thể.");
      return;
    }
    const variant = variantForms[index];
    if (variant.id) setRemovedVariantIds(current => [...current, variant.id]);
    setVariantForms(current => current.filter((_, variantIndex) => variantIndex !== index));
  };

  const save = async () => {
    const token = getToken();
    if (!token) return;
    if (!form.name.trim() || !form.categoryId) {
      toast.error("Vui lòng nhập tên và chọn danh mục sản phẩm.");
      return;
    }
    if (variantForms.length === 0 || variantForms.some(variant =>
      !variant.sku.trim() || !variant.variantName.trim() || variant.price === "" || Number(variant.price) < 0
    )) {
      toast.error("Mỗi biến thể cần có SKU, tên biến thể và giá hợp lệ.");
      return;
    }
    const usesToppings = form.productType === "coffee" || form.productType === "drink";
    if (usesToppings && toppingForms.some(topping => !topping.name.trim() || topping.price === "" || Number(topping.price) < 0)) {
      toast.error("Mỗi topping cần có tên và giá hợp lệ.");
      return;
    }
    const toppingNames = toppingForms.map(topping => topping.name.trim().toLocaleLowerCase("vi"));
    if (usesToppings && new Set(toppingNames).size !== toppingNames.length) {
      toast.error("Tên topping trong cùng một sản phẩm không được trùng nhau.");
      return;
    }
    const url = editing ? `${env.API_URL}/products/${editing.id}` : `${env.API_URL}/products`;
    const method = editing ? "PATCH" : "POST";
    const body: any = { name: form.name, categoryId: form.categoryId, description: form.description, imageUrl: form.imageUrl, productType: form.productType, branchId: form.branchId || null };
    if (!editing) {
      body.variants = variantForms.map(({ id, createdAt, updatedAt, productId, product, ...variant }) => ({
        ...variant,
        price: Number(variant.price),
        flavor: variant.flavor || undefined,
        topping: variant.topping || undefined,
        imageUrl: variant.imageUrl || undefined,
      }));
    }
    setSaving(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await parseRes(res); throw new Error(err.message); }
      const savedProduct = await parseRes(res);
      if (editing) {
        for (const variant of variantForms) {
          const payload = {
            sku: variant.sku.trim(),
            variantName: variant.variantName.trim(),
            size: variant.size || undefined,
            flavor: variant.flavor || undefined,
            topping: variant.topping || undefined,
            price: Number(variant.price),
            status: variant.status || "active",
            imageUrl: variant.imageUrl || undefined,
          };
          const variantRes = await fetch(
            variant.id ? `${env.API_URL}/products/variants/${variant.id}` : `${env.API_URL}/products/${savedProduct.id}/variants`,
            {
              method: variant.id ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload),
            },
          );
          if (!variantRes.ok) {
            const error = await parseRes(variantRes);
            throw new Error(error.message || `Không thể lưu biến thể ${variant.variantName}`);
          }
        }
        for (const variantId of removedVariantIds) {
          const deleteRes = await fetch(`${env.API_URL}/products/variants/${variantId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!deleteRes.ok) {
            const error = await parseRes(deleteRes);
            throw new Error(error.message || "Không thể xóa biến thể");
          }
        }
      }
      const toppingRes = await fetch(`${env.API_URL}/products/${savedProduct.id}/toppings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          toppings: usesToppings ? toppingForms.map((topping, index) => ({
            name: topping.name.trim(),
            price: Number(topping.price),
            isActive: topping.isActive ?? true,
            sortOrder: index,
          })) : [],
        }),
      });
      if (!toppingRes.ok) {
        const error = await parseRes(toppingRes);
        throw new Error(error.message || "Không thể lưu danh sách topping");
      }
      // Save recipes for each variant (coffee/drink)
      if (DRINK_TYPES.includes(form.productType) && editing) {
        for (const [variantId, recipe] of Object.entries(variantRecipes)) {
          const recipeRes = await fetch(`${env.API_URL}/inventory/variants/${variantId}/ingredients`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ingredients: recipe.map(r => ({ ingredientId: r.ingredientId, quantityRequired: Number(r.quantityRequired), unit: r.unit || 'g' })) }),
          });
          if (!recipeRes.ok) {
            const error = await parseRes(recipeRes);
            throw new Error(error.message || "Không thể lưu công thức nguyên liệu");
          }
        }
      }
      setShowModal(false); load();
      toast.success(editing ? "Đã cập nhật sản phẩm, biến thể, topping và công thức nguyên liệu." : "Đã tạo sản phẩm cùng biến thể và topping.");
    } catch (err: any) { toast.error(err.message || "Lỗi khi lưu sản phẩm"); }
    finally { setSaving(false); }
  };

  const updateVariantRecipe = (variantId: string, recipe: any[]) => {
    setVariantRecipes(prev => ({ ...prev, [variantId]: recipe }));
  };

  const remove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm("Xóa sản phẩm này?")) return;
    const item = items.find(p => p.id === id);
    try {
      const res = await fetch(`${env.API_URL}/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await parseRes(res); throw new Error(err.message); }
      if (item?.imageUrl) {
        await deleteStorageImage(item.imageUrl);
      }
      load();
    } catch (err: any) { toast.error(err.message || "Lỗi khi xóa sản phẩm"); }
  };

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const fmtPrice = (p: any) => {
    const prices = (p.variants || []).map((variant: any) => Number(variant.price)).filter(Number.isFinite);
    if (prices.length === 0) return "-";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min.toLocaleString("vi-VN")}đ` : `${min.toLocaleString("vi-VN")}đ – ${max.toLocaleString("vi-VN")}đ`;
  };

  return {
    items,
    cats,
    search,
    setSearch,
    loading,
    showModal,
    setShowModal,
    editing,
    form,
    setForm,
    variantForms,
    setVariantForms,
    toppingForms,
    setToppingForms,
    saving,
    openAdd,
    openEdit,
    updateVariantForm,
    removeVariantForm,
    save,
    remove,
    filtered,
    fmtPrice,
    emptyVariant,
    emptyTopping,
    branches,
    isAdmin,
    isManager,
    ingredients,
    variantRecipes,
    updateVariantRecipe,
  };
}
