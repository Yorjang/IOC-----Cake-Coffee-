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
  Percent,
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
  orderStatus: string;
  deliveryStatus: string | null;
  customer: string;
  phone: string;
  address: string;
  orderedAt: Date;
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
  lat: number | null;
  lng: number | null;
};

type RemitRequest = {
  id: string;
  totalExpected: number;
  totalActual: number | null;
  discrepancy: number;
  status: string;
  createdAt: Date;
};

type Dashboard = {
  orders: { assigned: number; delivering: number; completed: number; failed: number };
  wallet: { codHolding: number; totalShippingFee: number };
  codHolding: number;
  successRate: string;
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
};

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  assigned: "Chờ lấy hàng",
  picking_up: "Đang lấy hàng",
  picked_up: "Đã lấy hàng",
  delivering: "Đang giao",
  delivered: "Đã giao",
  failed: "Giao thất bại",
  cancelled: "Đã huỷ",
};

const STATUS_TONE: Record<string, string> = {
  "Đã xác nhận": "bg-slate-100 text-slate-700",
  "Đang chuẩn bị": "bg-amber-100 text-amber-700",
  "Chờ lấy hàng": "bg-amber-100 text-amber-700",
  "Đang lấy hàng": "bg-amber-100 text-amber-700",
  "Đã lấy hàng": "bg-amber-100 text-amber-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đã giao": "bg-green-100 text-green-700",
  "Giao thất bại": "bg-red-100 text-red-700",
};

const REMIT_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  completed: "Đã đối soát",
};

const TABS = [
  { key: "queue", label: "Hàng đợi giao hàng", icon: ListChecks },
  { key: "settlement", label: "Đối soát tiền COD", icon: Wallet },
];

// Ordered by urgency: orders already out for delivery need action first,
// then ones ready to head out, then ones still waiting at the store.
const MY_SECTIONS: { statuses: string[]; label: string }[] = [
  { statuses: ["delivering"], label: "Đang giao" },
  { statuses: ["picked_up"], label: "Đã lấy hàng, sẵn sàng giao" },
  { statuses: ["assigned", "picking_up"], label: "Chờ lấy hàng" },
];

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const getDirectionsUrl = (originAddress: string, destinationAddress: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;

const getCurrentPosition = (): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });

const mapOrder = (o: any): ShipperOrder => {
  const address = [o.shippingAddressStreet, o.shippingAddressWard, o.shippingAddressDistrict, o.shippingAddressProvince]
    .filter(Boolean)
    .join(", ");
  const isCod = o.paymentMethod === "cod" || o.paymentMethod === "cash";

  return {
    id: o.orderCode,
    orderId: o.id,
    orderStatus: o.orderStatus,
    deliveryStatus: o.deliveryStatus || null,
    customer: o.shippingRecipientName || o.user?.fullName || "Khách hàng",
    phone: o.shippingAddressPhone || o.user?.phone || "",
    address,
    orderedAt: new Date(o.createdAt),
    payment: isCod ? "COD" : "Đã thanh toán online",
    codAmount: isCod ? Number(o.totalAmount) : 0,
    items: (o.items || []).map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}`),
    itemsDetailed: (o.items || []).map((i: any) => ({
      name: `${i.productName}${i.variantName ? ` (${i.variantName})` : ""}`,
      qty: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
    totalAmount: Number(o.totalAmount),
    total: formatMoney(Number(o.totalAmount)),
    status: DELIVERY_STATUS_LABEL[o.deliveryStatus] || ORDER_STATUS_LABEL[o.orderStatus] || o.orderStatus,
    note: o.note || "",
    originAddress: o.branch?.address || "",
    originName: o.branch?.name || "Cửa hàng",
    lat: o.shippingLatitude != null ? Number(o.shippingLatitude) : null,
    lng: o.shippingLongitude != null ? Number(o.shippingLongitude) : null,
  };
};

function ShipperBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[status] ?? "bg-muted text-muted-foreground"}`}>
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
  onSubmit: (photoUrl: string) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState("");

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

        <p className="mt-3 text-xs text-muted-foreground">
          Ứng dụng sẽ xin quyền định vị để xác thực bạn đang ở gần địa điểm giao hàng.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            Huỷ
          </button>
          <button
            type="button"
            disabled={!photoUrl || submitting}
            onClick={() => onSubmit(photoUrl)}
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
          Đơn này sẽ được đánh dấu giao thất bại, chờ cửa hàng huỷ hoặc phân công lại. Bạn cần đứng gần khu vực giao hàng (trong vòng 1km) để báo cáo sự cố.
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");

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

  const matchesSearch = (order: ShipperOrder, query: string) => {
    if (!query) return true;
    const digitsQuery = query.replace(/\D/g, "");
    const phoneDigits = order.phone.replace(/\D/g, "");
    return (
      order.customer.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      (digitsQuery.length > 0 && phoneDigits.includes(digitsQuery))
    );
  };

  const sortOrders = (orders: ShipperOrder[]) =>
    [...orders].sort((a, b) =>
      sortOrder === "oldest" ? a.orderedAt.getTime() - b.orderedAt.getTime() : b.orderedAt.getTime() - a.orderedAt.getTime(),
    );

  const pendingOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortOrders(pendingRaw.map(mapOrder).filter((order) => matchesSearch(order, query)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRaw, searchQuery, sortOrder]);

  const myOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortOrders(myRaw.map(mapOrder).filter((order) => matchesSearch(order, query)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRaw, searchQuery, sortOrder]);

  const sectionedMyOrders = useMemo(
    () =>
      MY_SECTIONS.map((section) => ({
        ...section,
        orders: myOrders.filter((order) => order.deliveryStatus && section.statuses.includes(order.deliveryStatus)),
      })),
    [myOrders],
  );

  const codHolding = dashboard?.wallet?.codHolding ?? dashboard?.codHolding ?? 0;
  const hasPendingRemit = remitRequests.some((r) => r.status === "pending");

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
        toast.error(data?.message || "Không thể gửi yêu cầu đối soát.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối tới máy chủ.");
    } finally {
      setRemitting(false);
    }
  };

  const renderOrderCard = (order: ShipperOrder, actions: React.ReactNode) => (
    <article key={order.orderId} className="rounded-2xl border bg-card p-4 transition hover:shadow-md">
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

      {actions}
    </article>
  );

  const renderAssignAction = (order: ShipperOrder) => (
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        disabled={busyId === order.orderId}
        onClick={(event) => handleAssign(event, order)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyId === order.orderId ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
        Nhận đơn này
      </button>
    </div>
  );

  const renderMyAction = (order: ShipperOrder) => {
    if (order.deliveryStatus === "assigned" || order.deliveryStatus === "picking_up") {
      return (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={busyId === order.orderId}
            onClick={(event) => handlePickup(event, order)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyId === order.orderId ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
            Đã lấy hàng
          </button>
        </div>
      );
    }
    if (order.deliveryStatus === "picked_up") {
      return (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={busyId === order.orderId}
            onClick={(event) => handleStartDelivery(event, order)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyId === order.orderId ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
            Bắt đầu giao
          </button>
        </div>
      );
    }
    if (order.deliveryStatus === "delivering") {
      return (
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
      );
    }
    return null;
  };

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
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === key ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                >
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>

            {activeTab === "queue" && (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ShipperMetric label="Đơn có thể nhận" value={pendingRaw.length} sub="Chưa có shipper" icon={ListChecks} />
                  <ShipperMetric label="Đơn đang xử lý" value={myRaw.length} sub="Của bạn trong ca này" icon={Truck} />
                  <ShipperMetric label="Tiền COD đang giữ" value={formatMoney(codHolding)} sub="Chưa đối soát" icon={Coins} warn />
                  <ShipperMetric label="Tỷ lệ giao thành công" value={dashboard?.successRate ?? "—"} sub="Hôm nay" icon={Percent} />
                </div>

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

                <div className="space-y-8">
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                      Đơn của tôi
                      <span className="text-base font-normal text-muted-foreground">({myOrders.length})</span>
                    </h2>
                    {myOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Bạn chưa nhận đơn nào.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sectionedMyOrders.map((section) =>
                          section.orders.length === 0 ? null : (
                            <div key={section.label}>
                              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                {section.label}
                                <span className="text-sm font-normal text-muted-foreground">({section.orders.length})</span>
                              </h3>
                              <div className="space-y-3">
                                {section.orders.map((order) => renderOrderCard(order, renderMyAction(order)))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                      Đơn có thể nhận
                      <span className="text-base font-normal text-muted-foreground">({pendingOrders.length})</span>
                    </h2>
                    {pendingOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Không có đơn nào đang chờ shipper lúc này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingOrders.map((order) => renderOrderCard(order, renderAssignAction(order)))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "settlement" && (
              <>
                <div className="mb-5">
                  <h1 className="text-3xl">Đối soát tiền COD</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Số tiền COD bạn đang giữ và lịch sử các lần đối soát với cửa hàng.</p>
                </div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng tiền đang giữ, chưa đối soát</p>
                    <p className="mt-2 text-3xl font-bold text-primary">{formatMoney(codHolding)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={remitting || hasPendingRemit || codHolding <= 0}
                    onClick={handleRemitRequest}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {remitting ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                    {hasPendingRemit ? "Đang chờ cửa hàng xác nhận" : "Gửi yêu cầu đối soát"}
                  </button>
                </div>

                {remitRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                    Chưa có lần đối soát nào.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-secondary text-left">
                          <th className="p-3">Ngày gửi</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3 text-right">Dự kiến</th>
                          <th className="p-3 text-right">Thực nhận</th>
                          <th className="p-3 text-right">Chênh lệch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remitRequests.map((remit) => (
                          <tr key={remit.id} className="border-b last:border-0">
                            <td className="p-3 text-muted-foreground">
                              {new Date(remit.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3">
                              <ShipperBadge status={REMIT_STATUS_LABEL[remit.status] || remit.status} />
                            </td>
                            <td className="p-3 text-right font-semibold text-primary">{formatMoney(Number(remit.totalExpected))}</td>
                            <td className="p-3 text-right">
                              {remit.totalActual != null ? formatMoney(Number(remit.totalActual)) : "—"}
                            </td>
                            <td className="p-3 text-right">
                              {remit.totalActual != null ? formatMoney(Number(remit.discrepancy)) : "—"}
                            </td>
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
