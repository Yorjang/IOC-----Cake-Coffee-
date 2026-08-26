import { Check, Coffee, Phone, Truck, XCircle } from "lucide-react";
import { StaffBadge, StaffButton, formatMoney, mapDbToUiStatus } from "./StaffShared";

export function OnlineOrdersTab({ onlineOrders, updateOrderStatus, active }: any) {
  if (!active) return null;

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold">Xử lý đơn online</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xác nhận đơn, chuyển bếp, điều phối shipper và cập nhật trạng thái.
          </p>
        </div>
        <div className="space-y-3">
          {onlineOrders.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              Không có đơn online nào đang xử lý.
            </div>
          )}
          {onlineOrders.map((order: any) => {
            const uiStatus = mapDbToUiStatus(order);
            const itemsStr =
              order.items
                ?.map((i: any) => `${i.quantity}x ${i.productName}`)
                .join(" · ") || "N/A";

            const getOrderActions = (status: string) => {
              const actions = [];
              if (status === "pending") {
                actions.push({ label: "Xác nhận", next: "confirmed", Icon: Check, variant: "primary" });
              } else if (status === "confirmed") {
                actions.push({ label: "Chuyển bếp", next: "preparing", Icon: Coffee, variant: "secondary" });
              } else if (status === "preparing") {
                actions.push({ label: "Giao shipper", next: "shipping", Icon: Truck, variant: "secondary" });
              }
              if (status !== "completed" && status !== "cancelled") {
                actions.push({ label: "Huỷ", next: "cancelled", Icon: XCircle, variant: "danger" });
              }
              return actions;
            };

            const actions = getOrderActions(order.orderStatus);

            return (
              <article
                key={order.id}
                className="rounded-2xl border bg-background p-4 transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-primary">
                      #{order.orderCode} · {order.paymentMethod?.toUpperCase()}
                    </p>
                    <h3 className="mt-1 font-sans text-base font-semibold">
                      {order.shippingRecipientName || order.user?.fullName || "Khách"}
                    </h3>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} />
                        {order.shippingAddressPhone || order.user?.phone || "N/A"}
                      </span>
                      <span>{order.shippingAddressStreet || "Nhận tại quầy"}</span>
                    </p>
                  </div>
                  <StaffBadge status={uiStatus} />
                </div>
                <div className="mt-4 grid gap-3 rounded-xl bg-secondary p-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-medium">{itemsStr}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.note || "Không có ghi chú"}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-primary">
                      {formatMoney(Number(order.totalAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map(({ label, next, Icon, variant }) => (
                    <StaffButton
                      key={next}
                      onClick={() => updateOrderStatus(order.id, next)}
                      variant={variant}
                    >
                      <Icon size={14} /> {label}
                    </StaffButton>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-5">
        <h2 className="font-sans text-xl font-semibold">Ưu tiên xử lý</h2>
        <div className="mt-4 space-y-3">
          {onlineOrders.slice(0, 5).map((order: any) => (
            <div key={order.id} className="rounded-xl bg-secondary p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-primary">#{order.orderCode}</p>
                <span className="text-xs font-medium text-muted-foreground">
                  {mapDbToUiStatus(order)}
                </span>
              </div>
              <p className="mt-1 truncate text-sm font-medium">
                {order.items?.[0]?.productName || "Sản phẩm"}...
              </p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
