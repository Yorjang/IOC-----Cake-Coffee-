import React from 'react';
import { Plus, Trash2, FlaskConical } from 'lucide-react';
import { ImageUploader, AdminBtn } from '../../../components/admin/AdminShared';

export function AdminProductModal({
  showModal,
  setShowModal,
  editing,
  form,
  setForm,
  cats,
  variantForms,
  setVariantForms,
  emptyVariant,
  removeVariantForm,
  updateVariantForm,
  toppingForms,
  setToppingForms,
  emptyTopping,
  save,
  saving,
  branches,
  isAdmin,
  isManager,
  ingredients = [],
  variantRecipes = {},
  updateVariantRecipe,
}: any) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-sidebar p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground mb-4">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
        <div className="space-y-3">
          <input className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" placeholder="Tên sản phẩm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">-- Chọn danh mục --</option>
            {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {isAdmin && (
            <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Chi nhánh áp dụng: Toàn hệ thống</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>🏬 {b.name}</option>)}
            </select>
          )}
          <select className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}>
            <option value="cake">Bánh (cake)</option><option value="coffee">Cafe (coffee)</option><option value="drink">Đồ uống (drink)</option><option value="combo">Combo</option>
          </select>
          <textarea className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-sm text-foreground outline-none resize-none" rows={2} placeholder="Mô tả sản phẩm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <ImageUploader label="Hình ảnh sản phẩm" value={form.imageUrl} onChange={(url: string) => setForm({ ...form, imageUrl: url })} />
          <div className="rounded-2xl border border-sidebar-accent p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">Biến thể và giá bán</h4>
                <p className="mt-1 text-xs text-muted-foreground">Giá được lưu riêng cho từng biến thể sản phẩm.</p>
              </div>
              <AdminBtn variant="ghost" onClick={() => setVariantForms((current: any) => [...current, emptyVariant(form.name)])}>
                <span className="flex items-center gap-1"><Plus size={14} />Thêm biến thể</span>
              </AdminBtn>
            </div>

            <div className="space-y-4">
              {variantForms.map((variant: any, index: number) => (
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

                  {/* === CÔNG THỨC NGUYÊN LIỆU (chỉ coffee/drink) === */}
                  {(form.productType === 'coffee' || form.productType === 'drink') && variant.id && (
                    <div className="mt-3 rounded-xl border border-dashed border-sidebar-accent p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <FlaskConical size={13} className="text-primary" />
                          Công thức nguyên liệu
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = variantRecipes[variant.id] || [];
                            updateVariantRecipe(variant.id, [...current, { ingredientId: '', quantityRequired: 0, unit: 'g' }]);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition"
                        >
                          <Plus size={11} /> Thêm nguyên liệu
                        </button>
                      </div>

                      {(variantRecipes[variant.id] || []).length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-2">Chưa có công thức. Bấm "+ Thêm nguyên liệu" để bắt đầu.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(variantRecipes[variant.id] || []).map((row: any, rowIdx: number) => (
                            <div key={rowIdx} className="flex items-center gap-2">
                              <select
                                value={row.ingredientId || ''}
                                onChange={e => {
                                  const updated = [...(variantRecipes[variant.id] || [])];
                                  updated[rowIdx] = { ...updated[rowIdx], ingredientId: e.target.value };
                                  updateVariantRecipe(variant.id, updated);
                                }}
                                className="flex-1 rounded-lg bg-sidebar px-2 py-1.5 text-xs text-foreground outline-none"
                              >
                                <option value="">-- Chọn nguyên liệu --</option>
                                {ingredients.map((ing: any) => (
                                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={row.quantityRequired || ''}
                                onChange={e => {
                                  const updated = [...(variantRecipes[variant.id] || [])];
                                  updated[rowIdx] = { ...updated[rowIdx], quantityRequired: Number(e.target.value) };
                                  updateVariantRecipe(variant.id, updated);
                                }}
                                className="w-20 rounded-lg bg-sidebar px-2 py-1.5 text-xs text-foreground outline-none text-right"
                                placeholder="0"
                              />
                              <span className="text-[10px] text-muted-foreground w-6 text-center">
                                {ingredients.find((ing: any) => ing.id === row.ingredientId)?.unit || 'g'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (variantRecipes[variant.id] || []).filter((_: any, i: number) => i !== rowIdx);
                                  updateVariantRecipe(variant.id, updated);
                                }}
                                className="rounded-lg p-1 text-red-400 hover:bg-red-500/10 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {(form.productType === 'coffee' || form.productType === 'drink') && !variant.id && (
                    <p className="mt-2 text-[10px] text-amber-500 bg-amber-500/10 rounded-lg px-3 py-1.5">
                      ⚠️ Lưu sản phẩm trước, rồi mở lại để thêm công thức nguyên liệu.
                    </p>
                  )}
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
                <AdminBtn variant="ghost" onClick={() => setToppingForms((current: any) => [...current, emptyTopping()])}>
                  <span className="flex items-center gap-1"><Plus size={14} />Thêm topping</span>
                </AdminBtn>
              </div>
              <div className="space-y-3">
                {toppingForms.map((topping: any, index: number) => (
                  <div key={topping.id || index} className="grid items-end gap-3 rounded-xl bg-sidebar-accent p-3 sm:grid-cols-[minmax(0,1fr)_180px_130px_40px]">
                    <label className="grid gap-1 text-xs text-muted-foreground">
                      Tên topping
                      <input
                        value={topping.name || ""}
                        onChange={e => setToppingForms((current: any) => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, name: e.target.value } : item))}
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
                        onChange={e => setToppingForms((current: any) => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, price: e.target.value } : item))}
                        className="rounded-lg bg-sidebar px-3 py-2 text-sm font-semibold text-primary outline-none"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-muted-foreground">
                      Trạng thái
                      <select
                        value={topping.isActive === false ? "inactive" : "active"}
                        onChange={e => setToppingForms((current: any) => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, isActive: e.target.value === "active" } : item))}
                        className="rounded-lg bg-sidebar px-3 py-2 text-sm text-foreground outline-none"
                      >
                        <option value="active">Đang bán</option>
                        <option value="inactive">Tạm ẩn</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setToppingForms((current: any) => current.filter((_: any, itemIndex: number) => itemIndex !== index))}
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
  );
}
