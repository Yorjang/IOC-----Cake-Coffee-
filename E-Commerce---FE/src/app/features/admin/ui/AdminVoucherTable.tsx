import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { TableHeader, StatusBadge } from '../../../components/admin/AdminShared';

export function AdminVoucherTable({
  coupons,
  handleStartEdit,
  handleDelete,
  formatMoney
}: any) {
  return (
    <div className="overflow-auto rounded-2xl bg-sidebar p-5">
      <table className="w-full text-sm">
        <TableHeader cols={["Mã", "Sản phẩm", "Kiểu", "Giá trị", "Giảm tối đa", "Đơn tối thiểu", "Đã dùng / Giới hạn", "Hết hạn", "Trạng thái", "Thao tác"]} />
        <tbody>
          {coupons.map((v: any) => {
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
              <td colSpan={10} className="py-12 text-center text-muted-foreground">
                Không tìm thấy voucher nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
