
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Tag, Settings, ShoppingBag, Users, Star,
  BarChart2, Image, Edit, Trash2, Eye, Plus, CheckCircle, XCircle,
  TrendingUp, AlertCircle, Loader2, ToggleLeft, Search, Filter,
  ArrowUpRight, DollarSign, Clock, ChevronDown, Store, MapPin, Boxes,
  ReceiptText, ClipboardList, UploadCloud, PanelLeftClose, PanelLeftOpen, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import { ImageUploader, StatusBadge, AdminBtn, TableHeader } from "./AdminShared";

export function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", description: "", imageUrl: "", productType: "cake" });
  const [variantForms, setVariantForms] = useState<any[]>([]);
  const [toppingForms, setToppingForms] = useState<any[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${env.API_URL}/products`),
        fetch(`${env.API_URL}/products/categories`),
      ]);
      if (pRes.ok) setItems(await pRes.json());
      if (cRes.ok) setCats(await cRes.json());
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

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", categoryId: cats[0]?.id ?? "", description: "", imageUrl: "", productType: "cake" });
    setVariantForms([emptyVariant()]);
    setToppingForms([]);
    setRemovedVariantIds([]);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId, description: p.description || "", imageUrl: p.imageUrl || "", productType: p.productType });
    setVariantForms((p.variants || []).map((variant: any) => ({
      ...variant,
      price: String(variant.price),
      flavor: variant.flavor || "",
      topping: variant.topping || "",
      imageUrl: variant.imageUrl || "",
    })));
    setToppingForms([...(p.toppings || [])]
      .sort((a: any, b: any) => Number(a.sortOrder) - Number(b.sortOrder))
      .map((topping: any) => ({ ...topping, price: String(topping.price) })));
    setRemovedVariantIds([]);
    setShowModal(true);
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
    const body: any = { name: form.name, categoryId: form.categoryId, description: form.description, imageUrl: form.imageUrl, productType: form.productType };
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
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      const savedProduct = await res.json();
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
            const error = await variantRes.json();
            throw new Error(error.message || `Không thể lưu biến thể ${variant.variantName}`);
          }
        }
        for (const variantId of removedVariantIds) {
          const deleteRes = await fetch(`${env.API_URL}/products/variants/${variantId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!deleteRes.ok) {
            const error = await deleteRes.json();
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
        const error = await toppingRes.json();
        throw new Error(error.message || "Không thể lưu danh sách topping");
      }
      setShowModal(false); load();
      toast.success(editing ? "Đã cập nhật sản phẩm, biến thể và topping." : "Đã tạo sản phẩm cùng biến thể và topping.");
    } catch (err: any) { toast.error(err.message || "Lỗi khi lưu sản phẩm"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm("Xóa sản phẩm này?")) return;
    const item = items.find(p => p.id === id);
    try {
      const res = await fetch(`${env.API_URL}/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý sản phẩm</h2>
        <AdminBtn onClick={openAdd}><span className="flex items-center gap-1"><Plus size={14} />Thêm sản phẩm</span></AdminBtn>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm"><Search size={14} className="text-muted-foreground" /><input className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground" placeholder="Tìm sản phẩm…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      {loading ? <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div> : (
        <div className="overflow-auto rounded-2xl bg-sidebar">
          <table className="w-full text-sm">
            <TableHeader cols={["Sản phẩm", "Danh mục", "Giá", "Biến thể", "Loại", "Thao tác"]} />
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="size-10 rounded-lg object-cover" />}
                      <span className="text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{p.category?.name ?? "-"}</td>
                  <td className="py-3 font-semibold text-primary">{fmtPrice(p)}</td>
                  <td className="py-3 text-muted-foreground">{p.variants?.length ?? 0}</td>
                  <td className="py-3"><span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs text-primary">{p.productType}</span></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <AdminBtn variant="ghost" onClick={() => openEdit(p)}><Edit size={14} /></AdminBtn>
                      <AdminBtn variant="danger" onClick={() => remove(p.id)}><Trash2 size={14} /></AdminBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
            <div className="space-y-3">
              <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">-- Chọn danh mục --</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}>
                <option value="cake">Bánh (cake)</option><option value="coffee">Cafe (coffee)</option><option value="drink">Đồ uống (drink)</option><option value="combo">Combo</option>
              </select>
              <textarea className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none resize-none" rows={2} placeholder="Mô tả sản phẩm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <ImageUploader label="Hình ảnh sản phẩm" value={form.imageUrl} onChange={url => setForm({ ...form, imageUrl: url })} />
              <div className="rounded-2xl border border-sidebar-accent p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-foreground">Biến thể và giá bán</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Giá được lưu riêng cho từng biến thể sản phẩm.</p>
                  </div>
                  <AdminBtn variant="ghost" onClick={() => setVariantForms(current => [...current, emptyVariant(form.name)])}>
                    <span className="flex items-center gap-1"><Plus size={14} />Thêm biến thể</span>
                  </AdminBtn>
                </div>

                <div className="space-y-4">
                  {variantForms.map((variant, index) => (
                    <div key={variant.id || index} className="rounded-xl bg-sidebar-accent p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Biến thể {index + 1}</span>
                        <button type="button" onClick={() => removeVariantForm(index)} className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10" title="Xóa biến thể">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          SKU
                          <input value={variant.sku || ""} onChange={e => updateVariantForm(index, { sku: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none" placeholder="CAFE-SUA-M" />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
                          Tên biến thể
                          <input value={variant.variantName || ""} onChange={e => updateVariantForm(index, { variantName: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none" placeholder="Cà phê sữa - Vừa" />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Kích thước
                          <input value={variant.size || ""} onChange={e => updateVariantForm(index, { size: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none" placeholder="Vừa / 20cm" />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Hương vị
                          <input value={variant.flavor || ""} onChange={e => updateVariantForm(index, { flavor: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none" placeholder="Chocolate" />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Giá bán (VNĐ)
                          <input type="number" min="0" step="1000" value={variant.price ?? ""} onChange={e => updateVariantForm(index, { price: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm font-semibold text-primary outline-none" />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Trạng thái
                          <select value={variant.status || "active"} onChange={e => updateVariantForm(index, { status: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none">
                            <option value="active">Đang bán</option>
                            <option value="inactive">Tạm ẩn</option>
                            <option value="out_of_stock">Hết hàng</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground lg:col-span-1">
                          Ảnh biến thể (URL)
                          <input value={variant.imageUrl || ""} onChange={e => updateVariantForm(index, { imageUrl: e.target.value })} className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none" placeholder="https://..." />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {(form.productType === "coffee" || form.productType === "drink") && (
                <div className="rounded-2xl border border-sidebar-accent p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-foreground">Topping của sản phẩm</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Khách hàng sẽ nhìn thấy tên và giá topping đang bật ở trang chi tiết.</p>
                    </div>
                    <AdminBtn variant="ghost" onClick={() => setToppingForms(current => [...current, emptyTopping()])}>
                      <span className="flex items-center gap-1"><Plus size={14} />Thêm topping</span>
                    </AdminBtn>
                  </div>
                  <div className="space-y-3">
                    {toppingForms.map((topping, index) => (
                      <div key={topping.id || index} className="grid items-end gap-3 rounded-xl bg-sidebar-accent p-3 sm:grid-cols-[minmax(0,1fr)_180px_130px_40px]">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Tên topping
                          <input
                            value={topping.name || ""}
                            onChange={e => setToppingForms(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))}
                            className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none"
                            placeholder="Ví dụ: Kem phô mai"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Giá thêm (VNĐ)
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={topping.price ?? ""}
                            onChange={e => setToppingForms(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item))}
                            className="rounded-lg bg-sidebar px-3 py-2 text-sm font-semibold text-primary outline-none"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Trạng thái
                          <select
                            value={topping.isActive === false ? "inactive" : "active"}
                            onChange={e => setToppingForms(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: e.target.value === "active" } : item))}
                            className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none"
                          >
                            <option value="active">Đang bán</option>
                            <option value="inactive">Tạm ẩn</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => setToppingForms(current => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10"
                          title="Xóa topping"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    {toppingForms.length === 0 && (
                      <p className="rounded-xl bg-sidebar-accent px-4 py-5 text-center text-sm text-muted-foreground">Sản phẩm chưa có topping.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <AdminBtn variant="ghost" onClick={() => setShowModal(false)}>Hủy</AdminBtn>
              <AdminBtn onClick={save} disabled={saving}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo sản phẩm"}</AdminBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
