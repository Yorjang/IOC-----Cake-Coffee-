// Shared admin primitives reused across all admin sub-panels
export function StatusBadge({ status }: { status: string }) {
  const statusColor: Record<string, string> = {
    "Đang bán": "bg-green-100 text-green-700",
    "Hết hàng": "bg-red-100 text-red-700",
    "Đặt trước": "bg-blue-100 text-blue-700",
    "Hoàn thành": "bg-green-100 text-green-700",
    "Đang giao": "bg-blue-100 text-blue-700",
    "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
    "Xác nhận": "bg-purple-100 text-purple-700",
    "Huỷ": "bg-red-100 text-red-700",
    "Hiển thị": "bg-green-100 text-green-700",
    "Ẩn": "bg-gray-100 text-gray-600",
    "Đã duyệt": "bg-green-100 text-green-700",
    "Chờ duyệt": "bg-yellow-100 text-yellow-700",
    "Hoạt động": "bg-green-100 text-green-700",
    "Còn hiệu lực": "bg-green-100 text-green-700",
    "Hết hạn": "bg-gray-100 text-gray-600",
    "VIP": "bg-purple-100 text-purple-700",
    "Thường": "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function AdminBtn({ children, variant = "primary", onClick }: any) {
  const cls =
    variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/80" :
    variant === "danger"  ? "bg-red-100 text-red-700 hover:bg-red-200" :
                            "bg-sidebar-accent text-primary-foreground hover:bg-sidebar-accent/80";
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm transition ${cls}`}>
      {children}
    </button>
  );
}

export function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-sidebar-accent">
        {cols.map(c => (
          <th key={c} className="pb-3 text-left text-xs uppercase tracking-wider text-muted-foreground">{c}</th>
        ))}
      </tr>
    </thead>
  );
}
