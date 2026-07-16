
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

export function AdminOrders() {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrdersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${env.API_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái đơn hàng thành công.");
        loadOrders();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const mapDbToUiStatus = (status: string) => {
    if (status === 'pending' || status === 'confirmed') return 'Xác nhận';
    if (status === 'preparing') return 'Đang chuẩn bị';
    if (status === 'shipping') return 'Đang giao';
    if (status === 'completed') return 'Hoàn thành';
    if (status === 'cancelled') return 'Huỷ';
    return status;
  };

  const tabs = ["Tất cả", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành", "Huỷ"];

  const filtered = ordersList.filter(o => {
    const statusMatch = filter === "Tất cả" || mapDbToUiStatus(o.orderStatus) === filter;
    const searchMatch = !search ||
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.fullName || "").toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2 rounded-xl bg-sidebar px-3 py-2 text-sm">
          <Search size={14} className="text-muted-foreground" />
          <input
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-40"
            placeholder="Tìm mã đơn / khách…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${filter === t ? "bg-primary text-primary-foreground font-semibold" : "bg-sidebar text-muted-foreground hover:bg-sidebar-accent"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-2xl bg-sidebar p-5">
        <table className="w-full text-sm">
          <TableHeader cols={["Mã đơn", "Khách hàng", "Sản phẩm", "Tổng tiền", "Giờ", "Trạng thái", "Thao tác"]} />
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-sidebar-accent hover:bg-sidebar-accent transition">
                <td className="py-3 font-mono text-xs text-primary">#{o.orderCode}</td>
                <td className="py-3 text-foreground">{o.user?.fullName || "Khách vãng lai"}</td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                  {o.items?.map((item: any) => `${item.quantity}x ${item.productName} (${item.variantName})`).join(', ') || "N/A"}
                </td>
                <td className="py-3 font-semibold text-foreground">{formatMoney(Number(o.totalAmount))}</td>
                <td className="py-3 text-muted-foreground">
                  {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3">
                  <select
                    value={o.orderStatus}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="rounded bg-sidebar-accent px-2 py-1 text-xs text-foreground outline-none border border-sidebar-accent"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Xác nhận</option>
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="shipping">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Huỷ</option>
                  </select>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <AdminBtn variant="ghost" onClick={() => {
                      toast.info(`Hình thức: ${o.fulfillmentType === 'delivery' ? 'Giao hàng' : 'Nhận tại quầy'} · SĐT: ${o.user?.phone || 'N/A'}`);
                    }}><Eye size={14} /></AdminBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  Không có đơn hàng nào khớp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
