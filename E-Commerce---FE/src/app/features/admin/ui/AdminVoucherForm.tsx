
export function AdminVoucherForm({
  handleSave,
  editingVoucher,
  code, setCode,
  discountType, setDiscountType,
  discountValue, setDiscountValue,
  minOrderValue, setMinOrderValue,
  maxDiscount, setMaxDiscount,
  usageLimit, setUsageLimit,
  expiresAt, setExpiresAt,
  productId, setProductId,
  categoriesId, setCategoriesId,
  targetSize, setTargetSize,
  description, setDescription,
  isActive, setIsActive,
  products,
  categories,
  getFilteredSizes,
  handleCancelEdit,
  saving
}: any) {
  return (
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
              const selProd = products.find((p: any) => p.id === val);
              if (selProd && selProd.variants) {
                const sizes = selProd.variants.map((v: any) => v.size || "");
                const exists = sizes.some((s: string) => s.trim() === targetSize);
                if (!exists) setTargetSize("");
              }
            }
          }}
        >
          <option value="">Sản phẩm: Tất cả</option>
          {products.map((p: any) => (
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
          {categories.map((c: any) => (
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
          {getFilteredSizes().map((sz: any) => (
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
  );
}
