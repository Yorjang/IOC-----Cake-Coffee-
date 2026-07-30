import { Gift, Tag } from "lucide-react";
import { createPortal } from "react-dom";

export function VoucherDetailModal({ voucher, products: rawProducts = [], onSelectProduct, setView, onClose }: any) {
  const products = Array.isArray(rawProducts) ? rawProducts : (Array.isArray(rawProducts?.data) ? rawProducts.data : []);
  if (!voucher) return null;
  const d = voucher.rawData;
  const scopeProduct = d?.product;
  const scopeCategory = d?.category;
  const scopeLabel = d?.productId && scopeProduct
    ? 'Sản phẩm'
    : d?.categoriesId && scopeCategory
      ? 'Danh mục'
      : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ animation: 'fadeIn .2s ease' }}>
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp .25s ease' }}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>

        {/* Header */}
        <div className="text-center mb-5 mt-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Tag size={28} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold font-serif">{voucher.sub}</h3>
          <p className="text-sm text-primary font-mono tracking-widest mt-2 bg-primary/10 inline-block px-4 py-1.5 rounded-full uppercase font-bold">{voucher.code}</p>
        </div>

        {/* Description */}
        {voucher.title && voucher.title !== voucher.sub && (
          <div className="bg-secondary/50 p-3 rounded-xl text-center text-foreground font-medium text-sm mb-4">
            {voucher.title}
          </div>
        )}

        {/* Detail grid */}
        {d && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[110px_1fr] gap-y-2.5 gap-x-3 bg-secondary/30 rounded-xl p-4">
              <span className="text-muted-foreground font-medium">Giảm giá:</span>
              <span className="text-foreground font-semibold">
                {d.discountType === 'percent'
                  ? `${Number(d.discountValue)}%${d.maxDiscount ? ` (tối đa ${Number(d.maxDiscount).toLocaleString()}đ)` : ''}`
                  : `${Number(d.discountValue).toLocaleString()}đ`}
              </span>

              <span className="text-muted-foreground font-medium">Đơn tối thiểu:</span>
              <span className="text-foreground font-semibold">
                {d.minOrderValue > 0 ? `${Number(d.minOrderValue).toLocaleString()}đ` : 'Không yêu cầu'}
              </span>

              {(d.startsAt || d.expiresAt) && (
                <>
                  <span className="text-muted-foreground font-medium">Hạn dùng:</span>
                  <span className="text-foreground">
                    {d.startsAt ? new Date(d.startsAt).toLocaleDateString('vi-VN') : 'Nay'}
                    {' — '}
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                  </span>
                </>
              )}

              <span className="text-muted-foreground font-medium">Phạm vi:</span>
              <span className="text-foreground font-semibold">
                {scopeLabel ? scopeLabel : 'Toàn bộ đơn hàng'}
              </span>
            </div>

            {/* Applied product card */}
            {d.productId && scopeProduct && (
              <div className="border rounded-xl p-3 flex items-center gap-3">
                {scopeProduct.imageUrl && (
                  <img src={scopeProduct.imageUrl} alt={scopeProduct.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Áp dụng cho sản phẩm</p>
                  <p className="font-bold text-foreground truncate">{scopeProduct.name}</p>
                  {scopeProduct.category?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">Danh mục: {scopeProduct.category.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Applied category card */}
            {d.categoriesId && scopeCategory && !d.productId && (
              <div className="border rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift size={22} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Áp dụng cho danh mục</p>
                  <p className="font-bold text-foreground truncate">{scopeCategory.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => {
              if (d?.productId && scopeProduct) {
                const arr = [scopeProduct.name, "", scopeProduct.category?.name || "Khác", scopeProduct.imageUrl, "4.8", "Còn hàng", null, null];
                (arr as any).raw = scopeProduct;
                onSelectProduct(arr);
              } else if (d?.categoriesId) {
                setView(scopeCategory?.name || 'Thực đơn');
              } else {
                setView('Thực đơn');
              }
              onClose();
            }}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition"
          >
            Đặt hàng ngay
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
