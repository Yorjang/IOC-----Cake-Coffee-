import React from 'react';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { AdminBtn, TableHeader } from '../../../components/admin/AdminShared';

export function AdminProductTable({
  loading,
  filtered,
  fmtPrice,
  openEdit,
  remove
}: any) {
  if (loading) {
    return <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div>;
  }

  return (
    <>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={["Sản phẩm", "Danh mục", "Giá", "Biến thể", "Loại", "Thao tác"]} />
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="size-10 rounded-lg object-cover" />}
                    <div>
                      <span className="text-foreground font-medium">{p.name}</span>
                      {p.branchId && p.branch && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] text-green-600 font-semibold ml-1.5">
                          🏬 {p.branch.name}
                        </span>
                      )}
                    </div>
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
      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>
    </>
  );
}
