import React from "react";
import { Plus, Search } from "lucide-react";
import { AdminBtn } from "./AdminShared";
import { useAdminProducts } from "../../features/admin/hooks/useAdminProducts";
import { AdminProductTable } from "../../features/admin/ui/AdminProductTable";
import { AdminProductModal } from "../../features/admin/ui/AdminProductModal";

export function AdminProducts() {
  const {
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
  } = useAdminProducts();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý sản phẩm</h2>
        {isAdmin && (
          <AdminBtn onClick={openAdd}>
            <span className="flex items-center gap-1"><Plus size={14} />Thêm sản phẩm</span>
          </AdminBtn>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm">
          <Search size={14} className="text-muted-foreground" />
          <input 
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground" 
            placeholder="Tìm sản phẩm…" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>
      
      <AdminProductTable 
        loading={loading}
        filtered={filtered}
        fmtPrice={fmtPrice}
        openEdit={openEdit}
        remove={remove}
      />

      <AdminProductModal 
        showModal={showModal}
        setShowModal={setShowModal}
        editing={editing}
        form={form}
        setForm={setForm}
        cats={cats}
        variantForms={variantForms}
        setVariantForms={setVariantForms}
        emptyVariant={emptyVariant}
        removeVariantForm={removeVariantForm}
        updateVariantForm={updateVariantForm}
        toppingForms={toppingForms}
        setToppingForms={setToppingForms}
        emptyTopping={emptyTopping}
        save={save}
        saving={saving}
        branches={branches}
        isAdmin={isAdmin}
        isManager={isManager}
        ingredients={ingredients}
        variantRecipes={variantRecipes}
        updateVariantRecipe={updateVariantRecipe}
      />
    </div>
  );
}
