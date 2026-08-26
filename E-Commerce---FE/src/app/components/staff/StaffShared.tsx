export const statusTone: Record<string, string> = {
  "Chờ xác nhận": "bg-amber-100 text-amber-700",
  "Xác nhận": "bg-yellow-100 text-yellow-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Chờ shipper": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-green-100 text-green-700",
  "Huỷ": "bg-red-100 text-red-700",
  "Chờ hoàn tiền": "bg-orange-100 text-orange-700",
};

export const parsePrice = (value: string | number) => {
  if (typeof value === "number") return value;
  return Number(value.replace(/[^0-9]/g, "")) || 0;
};

export const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export const mapDbToUiStatus = (order: any) => {
  if (order.paymentStatus === "refund_pending") return "Chờ hoàn tiền";
  const status = order.orderStatus;
  if (status === "pending") return "Chờ xác nhận";
  if (status === "confirmed") return "Xác nhận";
  if (status === "preparing") return "Đang chuẩn bị";
  if (status === "shipping") return "Đang giao";
  if (status === "completed") return "Hoàn thành";
  if (status === "cancelled") return "Huỷ";
  return status;
};

export function StaffBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        statusTone[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function StaffButton({ children, variant = "primary", onClick, disabled }: any) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/80"
      : variant === "danger"
      ? "bg-red-100 text-red-700 hover:bg-red-200"
      : variant === "ghost"
      ? "border bg-card hover:bg-secondary"
      : "bg-secondary text-secondary-foreground hover:bg-secondary/80";

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function StaffMetric({ label, value, sub, icon: Icon, warn = false }: any) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className={`rounded-xl p-2 ${
            warn ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-primary"
          }`}
        >
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
