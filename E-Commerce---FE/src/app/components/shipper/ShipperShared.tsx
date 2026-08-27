import React from "react";
import { ListChecks, Wallet } from "lucide-react";

export type ShipperItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type ShipperOrder = {
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

export type RemitRequest = {
  id: string;
  totalExpected: number;
  totalActual: number | null;
  discrepancy: number;
  status: string;
  createdAt: Date;
};

export type Dashboard = {
  orders: { assigned: number; delivering: number; completed: number; failed: number };
  wallet: { codHolding: number; totalShippingFee: number };
  codHolding: number;
  successRate: string;
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
};

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  assigned: "Chờ lấy hàng",
  picking_up: "Đang lấy hàng",
  picked_up: "Đã lấy hàng",
  delivering: "Đang giao",
  delivered: "Đã giao",
  failed: "Giao thất bại",
  cancelled: "Đã huỷ",
};

export const STATUS_TONE: Record<string, string> = {
  "Đã xác nhận": "bg-slate-100 text-slate-700",
  "Đang chuẩn bị": "bg-amber-100 text-amber-700",
  "Chờ lấy hàng": "bg-amber-100 text-amber-700",
  "Đang lấy hàng": "bg-amber-100 text-amber-700",
  "Đã lấy hàng": "bg-amber-100 text-amber-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đã giao": "bg-green-100 text-green-700",
  "Giao thất bại": "bg-red-100 text-red-700",
};

export const REMIT_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  completed: "Đã đối soát",
};

export const TABS = [
  { key: "queue", label: "Hàng đợi giao hàng", icon: ListChecks },
  { key: "settlement", label: "Đối soát tiền COD", icon: Wallet },
];

export const MY_SECTIONS: { statuses: string[]; label: string }[] = [
  { statuses: ["delivering"], label: "Đang giao" },
  { statuses: ["picked_up"], label: "Đã lấy hàng, sẵn sàng giao" },
  { statuses: ["assigned", "picking_up"], label: "Chờ lấy hàng" },
];

export const QUICK_FAIL_REASONS = [
  "Tai nạn khi giao hàng",
  "Món ăn bị rơi, hỏng, không thể sử dụng",
  "Va chạm/đổ vỡ trên đường đi",
];

export const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export const getDirectionsUrl = (originAddress: string, destinationAddress: string) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;

export const getCurrentPosition = (): Promise<{ lat: number; lng: number } | null> =>
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

export const mapOrder = (o: any): ShipperOrder => {
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

export function ShipperBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function ShipperMetric({ label, value, sub, icon: Icon, warn = false }: any) {
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
