import { Bike, LogIn, LogOut, Loader2, Coins, Percent } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";

import {
  type Dashboard,
  type RemitRequest,
  type ShipperOrder,
  ShipperMetric,
  TABS,
  formatMoney,
  getCurrentPosition,
} from "./shipper/ShipperShared";
import {
  OrderDetailModal,
  ConfirmDeliveryModal,
  FailDeliveryModal,
} from "./shipper/ShipperModals";
import { QueueTab } from "./shipper/QueueTab";
import { SettlementTab } from "./shipper/SettlementTab";

type ShipperPanelProps = {
  onExit: () => void;
  onLoginRedirect?: () => void;
};

export function ShipperPanel({ onExit, onLoginRedirect }: ShipperPanelProps) {
  const [pendingRaw, setPendingRaw] = useState<any[]>([]);
  const [myRaw, setMyRaw] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [remitRequests, setRemitRequests] = useState<RemitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [remitting, setRemitting] = useState(false);
  const [detailOrder, setDetailOrder] = useState<ShipperOrder | null>(null);
  const [deliveringOrder, setDeliveringOrder] = useState<ShipperOrder | null>(null);
  const [failingOrder, setFailingOrder] = useState<ShipperOrder | null>(null);

  const authFetch = async (path: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const res = await fetch(`${env.API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await parseRes(res);
    return { res, data };
  };

  const loadAll = async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthed(false);
      setLoading(false);
      return;
    }

    try {
      const [pending, mine, dash, remits] = await Promise.all([
        authFetch("/delivery/pending"),
        authFetch("/delivery/my-deliveries"),
        authFetch("/delivery/dashboard"),
        authFetch("/cod/my-requests"),
      ]);

      const anyForbidden = [pending, mine, dash, remits].some(({ res }) => res.status === 403);
      setForbidden(anyForbidden);

      if (pending.res.ok) setPendingRaw(pending.data || []);
      if (mine.res.ok) setMyRaw(mine.data || []);
      if (dash.res.ok) setDashboard(dash.data);
      if (remits.res.ok) setRemitRequests(remits.data || []);

      if (!anyForbidden) {
        [pending, mine, dash, remits].forEach(({ res, data }) => {
          if (!res.ok) toast.error(data?.message || "Không thể tải dữ liệu giao hàng.");
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const callDelivery = async (orderId: string, action: string, body?: Record<string, any>) => {
    const { res, data } = await authFetch(`/delivery/${orderId}/${action}`, {
      method: "POST",
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
      toast.error(data?.message || "Thao tác thất bại.");
      return false;
    }
    return true;
  };

  const handleAssign = async (event: React.MouseEvent, order: ShipperOrder) => {
    event.stopPropagation();
    setBusyId(order.orderId);
    const ok = await callDelivery(order.orderId, "assign");
    if (ok) {
      toast.success("Đã nhận đơn, hãy tới cửa hàng lấy hàng.");
      await loadAll();
    }
    setBusyId(null);
  };

  const handlePickup = async (event: React.MouseEvent, order: ShipperOrder) => {
    event.stopPropagation();
    setBusyId(order.orderId);
    const ok = await callDelivery(order.orderId, "pickup");
    if (ok) {
      toast.success("Đã xác nhận lấy hàng từ cửa hàng.");
      await loadAll();
    }
    setBusyId(null);
  };

  const handleStartDelivery = async (event: React.MouseEvent, order: ShipperOrder) => {
    event.stopPropagation();
    setBusyId(order.orderId);
    const ok = await callDelivery(order.orderId, "start");
    if (ok) {
      toast.success("Bắt đầu giao hàng.");
      await loadAll();
    }
    setBusyId(null);
  };

  const handleConfirmDelivery = async (photoUrl: string) => {
    if (!deliveringOrder) return;
    setBusyId(deliveringOrder.orderId);
    const position = await getCurrentPosition();
    const ok = await callDelivery(deliveringOrder.orderId, "complete", {
      imageUrl: photoUrl,
      ...(position || {}),
    });
    if (ok) {
      toast.success("Đã xác nhận giao hàng thành công.");
      setDeliveringOrder(null);
      await loadAll();
    }
    setBusyId(null);
  };

  const handleFailDelivery = async (reason: string) => {
    if (!failingOrder) return;
    setBusyId(failingOrder.orderId);
    const position = await getCurrentPosition();
    const ok = await callDelivery(failingOrder.orderId, "fail", {
      reason,
      ...(position || {}),
    });
    if (ok) {
      toast.success("Đã báo cáo sự cố giao hàng.");
      setFailingOrder(null);
      await loadAll();
    }
    setBusyId(null);
  };

  const handleRemitRequest = async () => {
    setRemitting(true);
    try {
      const { res, data } = await authFetch("/cod/remit-request", { method: "POST" });
      if (res.ok) {
        toast.success("Đã gửi yêu cầu đối soát tiền COD.");
        await loadAll();
      } else {
        toast.error(data?.message || "Không thể yêu cầu đối soát.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi yêu cầu đối soát.");
    } finally {
      setRemitting(false);
    }
  };

  const codHolding = dashboard?.wallet?.codHolding ?? dashboard?.codHolding ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bike size={18} />
            </span>
            <div>
              <p className="font-serif text-lg font-bold">Sweet Bean Shipper</p>
              <p className="text-xs text-muted-foreground">Danh sách đơn cần giao trong ca</p>
            </div>
          </div>

          <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            <LogOut size={15} /> Thoát
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-5 py-6">
        {!authed ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-8 text-center">
            <p className="text-lg font-semibold">Bạn chưa đăng nhập</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập tài khoản shipper để xem danh sách đơn hàng thật.
            </p>
            <button
              type="button"
              onClick={onLoginRedirect}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
            >
              <LogIn size={14} /> Đăng nhập
            </button>
          </div>
        ) : forbidden ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-8 text-center">
            <p className="text-lg font-semibold">Tài khoản này không có quyền giao hàng</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Chỉ tài khoản với vai trò Shipper hoặc Quản lý cửa hàng mới truy cập được trang này.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    activeTab === key ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary hover:bg-accent"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <ShipperMetric label="Chưa lấy hàng" value={dashboard?.orders.assigned ?? 0} sub="Đang chờ bạn tới cửa hàng" icon={Bike} warn={(dashboard?.orders.assigned ?? 0) > 3} />
              <ShipperMetric label="Đang giao" value={dashboard?.orders.delivering ?? 0} sub="Trên đường tới khách" icon={Loader2} />
              <ShipperMetric label="Tiền mặt cần thu" value={formatMoney(codHolding)} sub="Giao cho thu ngân cuối ca" icon={Coins} warn={codHolding > 500000} />
              <ShipperMetric label="Tỉ lệ thành công" value={dashboard?.successRate ?? "100%"} sub="Tuần này" icon={Percent} />
            </div>

            <QueueTab 
              active={activeTab === "queue"}
              pendingRaw={pendingRaw}
              myRaw={myRaw}
              busyId={busyId}
              handleAssign={handleAssign}
              handlePickup={handlePickup}
              handleStartDelivery={handleStartDelivery}
              setFailingOrder={setFailingOrder}
              setDeliveringOrder={setDeliveringOrder}
              setDetailOrder={setDetailOrder}
            />

            <SettlementTab
              active={activeTab === "settlement"}
              codHolding={codHolding}
              remitRequests={remitRequests}
              remitting={remitting}
              handleRemitRequest={handleRemitRequest}
            />
          </>
        )}
      </main>

      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {deliveringOrder && (
        <ConfirmDeliveryModal
          order={deliveringOrder}
          submitting={busyId === deliveringOrder.orderId}
          onClose={() => setDeliveringOrder(null)}
          onSubmit={handleConfirmDelivery}
        />
      )}

      {failingOrder && (
        <FailDeliveryModal
          order={failingOrder}
          submitting={busyId === failingOrder.orderId}
          onClose={() => setFailingOrder(null)}
          onSubmit={handleFailDelivery}
        />
      )}
    </div>
  );
}
