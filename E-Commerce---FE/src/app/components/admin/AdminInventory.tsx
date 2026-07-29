import { parseRes } from '../../../utils/api';

import {
  Boxes,
  Edit,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { AdminBtn, StatusBadge, TableHeader } from "./AdminShared";

export function AdminInventory() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [formQuantity, setFormQuantity] = useState("");
  const [formMinQuantity, setFormMinQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [variantFilter, setVariantFilter] = useState("ALL");

  const loadInventory = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setStocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setBranches(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadBranches();
  }, []);

  const handleEdit = (stock: any) => {
    setEditingStock(stock);
    setFormQuantity(String(stock.quantity));
    setFormMinQuantity(String(stock.minQuantity));
  };

  const handleSave = async () => {
    const token = getAccessToken();
    setSaving(true);
    try {
      const res = await fetch(`${env.API_URL}/admin/inventory/${editingStock.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: Number(formQuantity),
          minQuantity: Number(formMinQuantity),
        }),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Cập nhật tồn kho thành công.");
        setEditingStock(null);
        loadInventory();
      } else {
        toast.error(data.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const getStatus = (qty: number, min: number) => {
    if (qty === 0) return "Hết hàng";
    if (qty <= min) return "Sắp hết";
    return "Đủ hàng";
  };

  const filteredStocks = stocks.filter(s => {
    if (branchFilter !== "ALL" && s.branchId !== branchFilter) return false;
    if (variantFilter !== "ALL" && s.variant?.variantName !== variantFilter) return false;
    return true;
  });

  const uniqueVariants = Array.from(new Set(stocks.map(s => s.variant?.variantName).filter(Boolean)));

  const totalSKU = filteredStocks.length;
  const lowStock = filteredStocks.filter(s => s.quantity <= s.minQuantity && s.quantity > 0).length;
  const outOfStock = filteredStocks.filter(s => s.quantity === 0).length;

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE) || 1;
  const paginatedStocks = filteredStocks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tồn kho theo chi nhánh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cảnh báo sắp hết, hết hàng và sản phẩm gần hạn để nhân viên xử lý kịp thời.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={branchFilter}
            onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
            className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select
            value={variantFilter}
            onChange={e => { setVariantFilter(e.target.value); setPage(1); }}
            className="rounded-xl bg-sidebar px-3 py-2 text-sm text-foreground outline-none border border-sidebar-accent"
          >
            <option value="ALL">Tất cả biến thể</option>
            {uniqueVariants.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Tổng SKU", String(totalSKU), `${new Set(filteredStocks.map(s => s.branchId)).size} chi nhánh`],
          ["Sắp hết hàng", String(lowStock), "Cần nhập hàng sớm"],
          ["Hết hàng", String(outOfStock), "Ẩn khỏi menu bán hàng"],
        ].map(([label, value, sub], index) => (
          <div key={label} className="rounded-2xl bg-sidebar p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Boxes size={17} className={index === 0 ? "text-primary" : index === 1 ? "text-yellow-400" : "text-red-400"} />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Chi nhánh", "Biến thể", "SKU", "Tồn", "Tối thiểu", "Trạng thái", "Thao tác"]} />
          <tbody>
            {paginatedStocks.map(row => {
              const status = getStatus(row.quantity, row.minQuantity);
              return (
                <tr key={row.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                  <td className="py-3 font-medium text-foreground">{row.branch?.name || "N/A"}</td>
                  <td className="py-3 text-muted-foreground">{row.variant?.product?.name} ({row.variant?.variantName || "Mặc định"})</td>
                  <td className="py-3 font-mono text-xs text-primary">{row.variant?.sku || "N/A"}</td>
                  <td className="py-3 font-semibold text-foreground">{row.quantity}</td>
                  <td className="py-3 text-muted-foreground">{row.minQuantity}</td>
                  <td className="py-3"><StatusBadge status={status} /></td>
                  <td className="py-3">
                    <AdminBtn variant="ghost" onClick={() => handleEdit(row)}><Edit size={14} /></AdminBtn>
                  </td>
                </tr>
              );
            })}
            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Không có dữ liệu tồn kho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-sidebar-accent pt-4">
            <span className="text-xs text-muted-foreground">
              Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredStocks.length)} trong {filteredStocks.length}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50">Trước</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>

      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-sidebar-accent bg-sidebar p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Điều chỉnh tồn kho</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Chi nhánh: {editingStock.branch?.name} - Biến thể: {editingStock.variant?.variantName}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Số lượng tồn kho</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formQuantity}
                  onChange={e => setFormQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Cảnh báo tối thiểu</label>
                <input
                  type="number"
                  className="w-full rounded-xl bg-sidebar-accent px-3 py-2 text-foreground outline-none border border-sidebar-accent"
                  value={formMinQuantity}
                  onChange={e => setFormMinQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingStock(null)}
                className="rounded-full border border-sidebar-accent px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


