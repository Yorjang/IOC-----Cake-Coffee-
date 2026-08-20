import {
  AlertTriangle,
  ArrowUpRight,
  Bike,
  CheckCircle,
  Clock,
  Coins,
  Eye,
  ListChecks,
  LogOut,
  Loader2,
  LogIn,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Search,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";
import { ImageUploader } from "./admin/AdminShared";

type ShipperPanelProps = {
  onExit: () => void;
  onLoginRedirect?: () => void;
};

type ShipperItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

type ShipperOrder = {
  id: string;
  orderId: string;
  rawStatus: string;
  customer: string;
  phone: string;
  address: string;
  orderedAt: Date;
  paidAt: Date | null;
  payment: string;
  codAmount: number;
  items: string[];
  itemsDetailed: ShipperItem[];
  totalAmount: number;
  total: string;
  status: string;
  note: string;
  originAddress: string;
  originName: string;
};

const QUEUE_STATUSES = ["confirmed", "preparing", "shipping"];

const statusLabel: Record<string, string> = {
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
};

const statusTone: Record<string, string> = {
  "Đã xác nhận": "bg-slate-100 text-slate-700",
  "Đang chuẩn bị": "bg-amber-100 text-amber-700",
  "Đang giao": "bg-blue-100 text-blue-700",
};

const TABS = [
  { key: "queue", label: "Hàng đợi giao hàng", icon: ListChecks },
  { key: "settlement", label: "Đối soát tiền COD", icon: Wallet },
];

// Ordered by urgency, not by pipeline order: orders already out for delivery need
// action first, then ones waiting for pickup, then ones still with the kitchen.
const QUEUE_SECTIONS = [
  { status: "shipping", label: "Đang giao" },
  { status: "preparing", label: "Đang chuẩn bị" },
  { status: "confirmed", label: "Đã xác nhận" },
];

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const isToday = (date: Date) => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const getDirectionsUrl = (originAddress: string, destinationAddress: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;

const mapOrder = (o: any): ShipperOrder => {
  const address = [o.shippingAddressStreet, o.shippingAddressWard, o.shippingAddressDistrict, o.shippingAddressProvince]
    .filter(Boolean)
    .join(", ");
  const isUnpaidCod = o.paymentMethod === "cod" && o.paymentStatus !== "paid";

  return {
    id: o.orderCode,
    orderId: o.id,
    rawStatus: o.orderStatus,
    customer: o.shippingRecipientName || o.user?.fullName || "Khách hàng",
    phone: o.shippingAddressPhone || o.user?.phone || "",
    address,
    orderedAt: new Date(o.createdAt),
    paidAt: o.paidAt ? new Date(o.paidAt) : null,
    payment: isUnpaidCod ? "COD" : "Đã thanh toán online",
    codAmount: isUnpaidCod ? Number(o.totalAmount) : 0,
    items: (o.items || []).map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}`),
    itemsDetailed: (o.items || []).map((i: any) => ({
      name: `${i.productName}${i.variantName ? ` (${i.variantName})` : ""}`,
      qty: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
    totalAmount: Number(o.totalAmount),
    total: formatMoney(Number(o.totalAmount)),
    status: statusLabel[o.orderStatus] || o.orderStatus,
    note: o.note || "",
    originAddress: o.branch?.address || "",
    originName: o.branch?.name || "Cửa hàng",
  };
};

function ShipperBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function ShipperMetric({ label, value, sub, icon: Icon, warn = false }: any) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`rounded-xl p-2 ${warn ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-primary"}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: ShipperOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 font-sans text-lg">Chi tiết đơn hàng</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Khách hàng</p>
            <p className="mt-1 text-sm">{order.customer} · {order.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Địa chỉ giao hàng</p>
            <p className="mt-1 text-sm">{order.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Lấy hàng từ</p>
            <p className="mt-1 text-sm">{order.originName} · {order.originAddress}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Đặt lúc</p>
            <p className="mt-1 text-sm">{order.orderedAt.toLocaleString("vi-VN")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Sản phẩm</p>
            <div className="mt-1 space-y-1">
              {order.itemsDetailed.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.qty}</span>
                  <span className="text-muted-foreground">{formatMoney(item.unitPrice * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>
          {order.note && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Ghi chú khách hàng</p>
              <p className="mt-1 text-sm">{order.note}</p>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Thanh toán</p>
              <p className="mt-1 text-sm">{order.payment === "COD" ? `COD · ${formatMoney(order.codAmount)}` : order.payment}</p>
            </div>
            <p className="text-lg font-bold text-primary">{order.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeliveryModal({
  order,
  submitting,
  onClose,
  onSubmit,
}: {
  order: ShipperOrder;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (photoUrl: string, note: string) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 font-sans text-lg">Xác nhận đã giao</h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.customer} · {order.address}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <ImageUploader label="Ảnh xác nhận giao hàng (bắt buộc)" value={photoUrl} onChange={setPhotoUrl} />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Ghi chú (không bắt buộc)</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Ví dụ: đã giao tận tay, để trước cửa..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            Huỷ
          </button>
          <button
            type="button"
            disabled={!photoUrl || submitting}
            onClick={() => onSubmit(photoUrl, note)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

const QUICK_FAIL_REASONS = [
  "Tai nạn khi giao hàng",
  "Món ăn bị rơi, hỏng, không thể sử dụng",
  "Va chạm/đổ vỡ trên đường đi",
];

function FailDeliveryModal({
  order,
  submitting,
  onClose,
  onSubmit,
}: {
  order: ShipperOrder;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 flex items-center gap-2 font-sans text-lg text-destructive">
              <AlertTriangle size={18} />
              Không thể giao đơn hàng này
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.customer} · {order.address}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
          Đơn này sẽ được huỷ và cửa hàng sẽ cần làm lại một đơn mới để giao cho khách. Khách hàng sẽ phải chờ lâu hơn dự kiến.
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Lý do</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_FAIL_REASONS.map((quickReason) => (
              <button
                key={quickReason}
                type="button"
                onClick={() => setReason(quickReason)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${reason === quickReason ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
              >
                {quickReason}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Mô tả chi tiết lý do không thể giao đơn hàng..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            Đóng
          </button>
          <button
            type="button"
            disabled={!reason.trim() || submitting}
            onClick={() => onSubmit(reason.trim())}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Xác nhận không thể giao
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShipperPanel({ onExit, onLoginRedirect }: ShipperPanelProps) {
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [activeTab, setActiveTab] = useState("queue");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<ShipperOrder | null>(null);
  const [deliveringOrder, setDeliveringOrder] = useState<ShipperOrder | null>(null);
  const [failingOrder, setFailingOrder] = useState<ShipperOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");

  const loadOrders = async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthed(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${env.API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setRawOrders(data || []);
      } else {
        toast.error(data?.message || "Không thể tải danh sách đơn hàng.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const queueOrders = useMemo(
    () =>
      rawOrders
        .filter((o: any) => o.fulfillmentType === "delivery" && QUEUE_STATUSES.includes(o.orderStatus))
        .map(mapOrder),
    [rawOrders],
  );

  const filteredQueueOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const digitsQuery = query.replace(/\D/g, "");
    const filtered = query
      ? queueOrders.filter((order) => {
          const phoneDigits = order.phone.replace(/\D/g, "");
          return (
            order.customer.toLowerCase().includes(query) ||
            order.id.toLowerCase().includes(query) ||
            (digitsQuery && phoneDigits.includes(digitsQuery))
          );
        })
      : queueOrders;

    return [...filtered].sort((a, b) =>
      sortOrder === "oldest"
        ? a.orderedAt.getTime() - b.orderedAt.getTime()
        : b.orderedAt.getTime() - a.orderedAt.getTime(),
    );
  }, [queueOrders, searchQuery, sortOrder]);

  const sectionedQueueOrders = useMemo(
    () =>
      QUEUE_SECTIONS.map((section) => ({
        ...section,
        orders: filteredQueueOrders.filter((order) => order.rawStatus === section.status),
      })),
    [filteredQueueOrders],
  );

  const settlementOrders = useMemo(
    () =>
      rawOrders
        .filter(
          (o: any) =>
            o.fulfillmentType === "delivery" &&
            o.paymentMethod === "cod" &&
            o.orderStatus === "completed" &&
            o.paidAt &&
            isToday(new Date(o.paidAt)),
        )
        .map(mapOrder),
    [rawOrders],
  );

  const settlementTotal = useMemo(
    () => settlementOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [settlementOrders],
  );

  const stats = useMemo(() => {
    const total = queueOrders.length;
    const inProgress = queueOrders.filter((order) => order.status === "Đang giao").length;
    const codToCollect = queueOrders.reduce((sum, order) => sum + order.codAmount, 0);
    return { total, inProgress, codToCollect };
  }, [queueOrders]);

  const changeStatus = async (order: ShipperOrder, status: string, extra?: Record<string, any>): Promise<boolean> => {
    const token = getAccessToken();
    setUpdatingId(order.orderId);
    try {
      const res = await fetch(`${env.API_URL}/admin/orders/${order.orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        await loadOrders();
        return true;
      }
      const errData = await parseRes(res);
      toast.error(errData?.message || "Không thể cập nhật đơn hàng.");
      return false;
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối tới máy chủ.");
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkPickedUp = async (event: React.MouseEvent, order: ShipperOrder) => {
    event.stopPropagation();
    const ok = await changeStatus(order, "shipping");
    if (ok) toast.success("Đã xác nhận lấy hàng, bắt đầu giao.");
  };

  const handleConfirmDelivery = async (photoUrl: string, note: string) => {
    if (!deliveringOrder) return;
    const ok = await changeStatus(deliveringOrder, "completed", { proofImageUrl: photoUrl, note });
    if (ok) {
      toast.success("Đã xác nhận giao hàng thành công.");
      setDeliveringOrder(null);
    }
  };

  const handleFailDelivery = async (reason: string) => {
    if (!failingOrder) return;
    const ok = await changeStatus(failingOrder, "cancelled", { note: reason, cancelReason: reason });
    if (ok) {
      toast.success("Đã huỷ đơn do sự cố giao hàng. Hãy báo cửa hàng chuẩn bị lại đơn mới cho khách.");
      setFailingOrder(null);
    }
  };

  const renderOrderCard = (order: ShipperOrder) => (
    <article key={order.id} className="rounded-2xl border bg-card p-4 transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-primary">{order.id}</p>
          <h3 className="mt-1 font-sans text-lg font-semibold">{order.customer}</h3>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-base text-muted-foreground">
            <a
              href={`tel:${order.phone.replace(/\s+/g, "")}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <Phone size={15} />{order.phone}
            </a>
            <span className="inline-flex items-center gap-1">
              <MapPin size={15} />{order.address}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={15} />Đặt lúc {order.orderedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ShipperBadge status={order.status} />
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setDetailOrder(order)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition hover:bg-secondary"
            >
              <Eye size={12} />
              Chi tiết
            </button>
            <button
              type="button"
              onClick={() => window.open(getDirectionsUrl(order.originAddress, order.address), "_blank")}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition hover:bg-secondary"
            >
              <Navigation size={12} />
              Chỉ đường từ {order.originName}
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-secondary p-3 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-base font-medium">{order.items.join(" · ")}</p>
          {order.note && <p className="mt-1 text-sm text-muted-foreground">{order.note}</p>}
        </div>
        <div className="text-left md:text-right">
          <p className="text-lg font-semibold text-primary">{order.total}</p>
          <p className="text-sm text-muted-foreground">
            {order.payment === "COD" ? `COD · ${formatMoney(order.codAmount)}` : order.payment}
          </p>
        </div>
      </div>

      {order.rawStatus === "preparing" && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={updatingId === order.orderId}
            onClick={(event) => handleMarkPickedUp(event, order)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updatingId === order.orderId ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <PackageCheck size={14} />
            )}
            Đã lấy hàng, bắt đầu giao
          </button>
        </div>
      )}

      {order.rawStatus === "shipping" && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFailingOrder(order);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <AlertTriangle size={14} />
            Tôi không thể giao đơn này
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeliveringOrder(order);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
          >
            <CheckCircle size={14} />
            Xác nhận đã giao
          </button>
        </div>
      )}
    </article>
  );

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
              Đăng nhập tài khoản nhân viên để xem danh sách đơn hàng thật.
            </p>
            <button
              type="button"
              onClick={onLoginRedirect}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
            >
              <LogIn size={14} /> Đăng nhập
            </button>
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
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === key ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                >
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>

            {activeTab === "queue" && (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <ShipperMetric label="Đơn cần giao" value={stats.total} sub="Trong ca hiện tại" icon={ListChecks} />
                  <ShipperMetric label="Đang giao" value={stats.inProgress} sub="Đơn đang trên đường" icon={Truck} />
                  <ShipperMetric label="Tiền COD cần thu" value={formatMoney(stats.codToCollect)} sub="Chưa hoàn tất" icon={Coins} warn />
                </div>

                <div className="mb-5">
                  <h1 className="text-3xl">Hàng đợi giao hàng</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Theo dõi đơn từ lúc cửa hàng nhận đến khi bắt đầu giao. Đơn "Đang chuẩn bị" chỉ có thể lấy khi cửa hàng đã bàn giao trực tiếp.
                  </p>
                </div>

                {queueOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                    Không có đơn nào cần giao lúc này.
                  </div>
                ) : (
                  <>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border bg-input-background px-3 py-2">
                        <Search size={15} className="text-muted-foreground" />
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Tìm theo tên khách, SĐT hoặc mã đơn..."
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSortOrder("oldest")}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${sortOrder === "oldest" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                        >
                          Cũ nhất trước
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortOrder("newest")}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${sortOrder === "newest" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                        >
                          Mới nhất trước
                        </button>
                      </div>
                    </div>

                    {filteredQueueOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                        Không tìm thấy đơn phù hợp.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sectionedQueueOrders.map((section) =>
                          section.orders.length === 0 ? null : (
                            <div key={section.status}>
                              <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                                {section.label}
                                <span className="text-base font-normal text-muted-foreground">({section.orders.length})</span>
                              </h2>
                              <div className="space-y-3">
                                {section.orders.map((order) => renderOrderCard(order))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === "settlement" && (
              <>
                <div className="mb-5">
                  <h1 className="text-3xl">Đối soát tiền COD hôm nay</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Danh sách đơn COD đã giao hôm nay và tổng tiền cần nộp lại.</p>
                </div>

                <div className="mb-5 rounded-2xl border bg-card p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Tổng tiền cần nộp</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{formatMoney(settlementTotal)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{settlementOrders.length} đơn COD đã giao hôm nay</p>
                </div>

                {settlementOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                    Chưa có đơn COD nào hoàn tất hôm nay.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-secondary text-left">
                          <th className="p-3">Mã đơn</th>
                          <th className="p-3">Khách hàng</th>
                          <th className="p-3">Giờ giao</th>
                          <th className="p-3 text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlementOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="p-3 font-mono text-primary">{order.id}</td>
                            <td className="p-3">{order.customer}</td>
                            <td className="p-3 text-muted-foreground">
                              {order.paidAt ? order.paidAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                            <td className="p-3 text-right font-semibold text-primary">{order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {deliveringOrder && (
        <ConfirmDeliveryModal
          order={deliveringOrder}
          submitting={updatingId === deliveringOrder.orderId}
          onClose={() => setDeliveringOrder(null)}
          onSubmit={handleConfirmDelivery}
        />
      )}

      {failingOrder && (
        <FailDeliveryModal
          order={failingOrder}
          submitting={updatingId === failingOrder.orderId}
          onClose={() => setFailingOrder(null)}
          onSubmit={handleFailDelivery}
        />
      )}
    </div>
  );
}
