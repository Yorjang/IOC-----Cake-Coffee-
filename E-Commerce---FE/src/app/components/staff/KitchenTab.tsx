export function KitchenTab({ kitchenTickets, updateOrderStatus, active }: any) {
  if (!active) return null;

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-5">
        <h1 className="text-3xl font-semibold">Bếp & chuẩn bị</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phiếu bếp theo trạm và trạng thái chuẩn bị.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["pending", "confirmed", "preparing"].map((statusKey) => {
          const statusName =
            statusKey === "pending"
              ? "Chờ xác nhận"
              : statusKey === "confirmed"
              ? "Đã xác nhận"
              : "Đang chuẩn bị";
          const columnOrders = kitchenTickets.filter((o: any) => o.orderStatus === statusKey);

          return (
            <div key={statusKey} className="rounded-2xl bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-lg font-semibold">{statusName}</h2>
                <span className="text-xs text-muted-foreground">
                  {columnOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnOrders.map((ticket: any) => (
                  <article
                    key={ticket.id}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <p className="font-mono text-xs text-primary">
                      #{ticket.orderCode} · {ticket.fulfillmentType}
                    </p>
                    {ticket.items?.map((item: any) => (
                      <h3 key={item.id} className="mt-1 font-medium text-sm">
                        {item.quantity}x {item.productName}
                      </h3>
                    ))}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {statusKey === "confirmed" && (
                        <button
                          onClick={() => updateOrderStatus(ticket.id, "preparing")}
                          className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground"
                        >
                          Làm ngay
                        </button>
                      )}
                      {statusKey === "preparing" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              ticket.id,
                              ticket.fulfillmentType === "delivery"
                                ? "shipping"
                                : "completed"
                            )
                          }
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                        >
                          Hoàn tất
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
