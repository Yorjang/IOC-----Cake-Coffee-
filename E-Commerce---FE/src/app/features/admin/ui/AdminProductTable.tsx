import React from 'react';
import { Loader2, Edit, Trash2, FlaskConical } from 'lucide-react';
import { AdminBtn, TableHeader } from '../../../components/admin/AdminShared';

const DRINK_TYPES = ['coffee', 'drink'];

export function AdminProductTable({
  loading,
  filtered,
  fmtPrice,
  openEdit,
  remove,
  isAdmin
}: any) {
  if (loading) {
    return <div className="py-10 text-center text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={16} />Đang tải…</div>;
  }

  const cols = ["Sản phẩm", "Danh mục", "Giá", "Biến thể", "Loại", "Nguyên liệu"];
  if (isAdmin) {
    cols.push("Thao tác");
  }

  return (
    <>
      <div className="overflow-auto rounded-2xl bg-sidebar">
        <table className="w-full text-sm">
          <TableHeader cols={cols} />
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="size-10 rounded-lg object-cover" />}
                    <div>
                      <span className="text-foreground font-medium">{p.name}</span>
                      {p.branchId && p.branch ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] text-green-600 font-semibold ml-1.5">
                          🏬 {p.branch.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] text-blue-500 font-semibold ml-1.5">
                          🌐 Toàn hệ thống
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{p.category?.name ?? "-"}</td>
                <td className="py-3 px-4 font-semibold text-primary">{fmtPrice(p)}</td>
                <td className="py-3 px-4 text-muted-foreground">{p.variants?.length ?? 0}</td>
                <td className="py-3 px-4"><span className="rounded-full bg-sidebar-accent px-3 py-1 text-xs text-primary">{p.productType}</span></td>
                <td className="py-3 px-4 max-w-[200px]">
                  {DRINK_TYPES.includes(p.productType) ? (
                     <IngredientSummaryCell variants={p.variants} />
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <AdminBtn variant="ghost" onClick={() => openEdit(p)}><Edit size={14} /></AdminBtn>
                      <AdminBtn variant="danger" onClick={() => remove(p.id)}><Trash2 size={14} /></AdminBtn>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} sản phẩm</p>
    </>
  );
}

function IngredientSummaryCell({ variants }: { variants: any[] }) {
  // Collect all ingredients across variants with recipes
  const variantsWithRecipe = (variants || []).filter(
    (v: any) => v.variantIngredients && v.variantIngredients.length > 0
  );

  if (variantsWithRecipe.length === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <FlaskConical size={11} />
        Chưa có công thức
      </span>
    );
  }

  // Show recipe for the first variant as preview
  const firstVariant = variantsWithRecipe[0];
  const recipes: any[] = firstVariant.variantIngredients || [];

  return (
    <div className="flex flex-wrap gap-1">
      {recipes.slice(0, 3).map((r: any, i: number) => (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium"
        >
          {Number(r.quantityRequired)}g {r.ingredient?.name ?? '?'}
        </span>
      ))}
      {recipes.length > 3 && (
        <span className="text-[10px] text-muted-foreground">+{recipes.length - 3} khác</span>
      )}
      {variantsWithRecipe.length > 1 && (
        <span className="text-[10px] text-muted-foreground block w-full mt-0.5">
          ({variantsWithRecipe.length} biến thể)
        </span>
      )}
    </div>
  );
}
