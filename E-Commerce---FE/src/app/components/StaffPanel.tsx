import {
  Banknote,
  CakeSlice,
  ClipboardCheck,
  Coffee,
  LogOut,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Store,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";

import { PosTab } from "./staff/PosTab";
import { OnlineOrdersTab } from "./staff/OnlineOrdersTab";
import { KitchenTab } from "./staff/KitchenTab";
import { ShiftHandoverTab } from "./staff/ShiftHandoverTab";
import { StaffMetric, formatMoney } from "./staff/StaffShared";

type StaffPanelProps = {
  onExit: () => void;
  staffUser?: any;
  products?: any[];
  categories?: any[];
  selectedStore?: any;
};

export function StaffPanel({ onExit, staffUser, products = [], categories = [], selectedStore }: StaffPanelProps) {
  const [active, setActive] = useState("counter");
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const token = getAccessToken();
    const branchId = staffUser?.branchId || staffUser?.branch?.id || selectedStore?.id;
    try {
      const res = await fetch(`${env.API_URL}/admin/orders?branchId=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
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

  const updateOrderStatus = async (id: string, newStatus: string) => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái thành công.");
        loadOrders();
      } else {
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối.");
    }
  };

  const onlineOrders = useMemo(() => {
    return ordersList
      .filter(
        (o) =>
          o.fulfillmentType === "delivery" &&
          o.orderStatus !== "completed" &&
          o.orderStatus !== "cancelled"
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersList]);

  const kitchenTickets = useMemo(() => {
    return ordersList.filter((o) =>
      ["pending", "confirmed", "preparing"].includes(o.orderStatus)
    );
  }, [ordersList]);

  const invoices = useMemo(() => {
    const today = new Date().toDateString();
    return ordersList
      .filter((o) => new Date(o.createdAt).toDateString() === today)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersList]);

  const todayRevenue = invoices.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const newOnlineOrders = onlineOrders.filter((o) => o.orderStatus === "pending").length;

  const tabs = [
    { key: "counter", label: "Bán tại quầy", icon: Store },
    { key: "online", label: "Đơn online", icon: ShoppingBag },
    { key: "kitchen", label: "Bếp & chuẩn bị", icon: PackageCheck },
    { key: "shift", label: "Bàn giao ca", icon: ClipboardCheck },
  ];

  const branchId = staffUser?.branchId || staffUser?.branch?.id || selectedStore?.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <CakeSlice size={18} />
            </span>
            <div>
              <p className="font-serif text-lg font-bold">Sweet Bean Staff</p>
              <p className="text-xs text-muted-foreground">
                {staffUser?.fullName || staffUser?.email || "Nhân viên"} · POS bán hàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:bg-secondary"
          >
            <LogOut size={15} /> Thoát
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-5 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StaffMetric
            label="Đơn online mới"
            value={newOnlineOrders}
            sub="Cần xác nhận"
            icon={ShoppingBag}
          />
          <StaffMetric
            label="Đơn đang bếp"
            value={kitchenTickets.filter((o) => o.orderStatus === "preparing").length}
            sub="Đang chuẩn bị"
            icon={Coffee}
            warn={kitchenTickets.length > 5}
          />
          <StaffMetric
            label="Hoá đơn hôm nay"
            value={invoices.length}
            sub="Ca hiện tại"
            icon={ReceiptText}
          />
          <StaffMetric
            label="Doanh thu ca"
            value={formatMoney(todayRevenue)}
            sub="Tổng tiền thu được"
            icon={Banknote}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                active === key
                  ? "bg-amber-900 text-white shadow-md"
                  : "bg-secondary hover:bg-accent"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-secondary">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            <PosTab
              active={active === "counter"}
              products={products}
              categories={categories}
              branchId={branchId}
              loadOrders={loadOrders}
            />
            <OnlineOrdersTab
              active={active === "online"}
              onlineOrders={onlineOrders}
              updateOrderStatus={updateOrderStatus}
            />
            <KitchenTab
              active={active === "kitchen"}
              kitchenTickets={kitchenTickets}
              updateOrderStatus={updateOrderStatus}
            />
            <ShiftHandoverTab
              active={active === "shift"}
              invoices={invoices}
            />
          </>
        )}
      </main>
    </div>
  );
}
