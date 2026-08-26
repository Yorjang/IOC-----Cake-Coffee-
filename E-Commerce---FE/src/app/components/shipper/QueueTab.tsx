import React, { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CircleCheck, Clock, Eye, Loader2, MapPin, Navigation, PackageCheck, Phone, Search, Truck } from "lucide-react";
import { MY_SECTIONS, ShipperBadge, type ShipperOrder, formatMoney, getDirectionsUrl, mapOrder } from "./ShipperShared";

export function QueueTab({
  active,
  pendingRaw,
  myRaw,
  busyId,
  handleAssign,
  handlePickup,
  handleStartDelivery,
  setFailingOrder,
  setDeliveringOrder,
  setDetailOrder
}: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");

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
    return sortOrders(pendingRaw.map(mapOrder).filter((order: ShipperOrder) => matchesSearch(order, query)));
  }, [pendingRaw, searchQuery, sortOrder]);

  const myOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortOrders(myRaw.map(mapOrder).filter((order: ShipperOrder) => matchesSearch(order, query)));
  }, [myRaw, searchQuery, sortOrder]);

  const sectionedMyOrders = useMemo(
    () =>
      MY_SECTIONS.map((section) => ({
        ...section,
        orders: myOrders.filter((order) => order.deliveryStatus && section.statuses.includes(order.deliveryStatus)),
      })),
    [myOrders],
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
            <CircleCheck size={14} />
            Xác nhận đã giao
          </button>
        </div>
      );
    }
    return null;
  };

  const renderOrderCard = (order: ShipperOrder, actions: React.ReactNode) => (
    <article
      key={order.id}
      onClick={() => setDetailOrder(order)}
      className="cursor-pointer rounded-2xl border bg-card p-4 transition hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-primary">{order.id}</p>
          <h3 className="mt-1 font-sans text-base font-semibold">{order.customer}</h3>
          <p className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
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
              onClick={(e) => { e.stopPropagation(); setDetailOrder(order); }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition hover:bg-secondary"
            >
              <Eye size={12} />
              Chi tiết
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); window.open(getDirectionsUrl(order.originAddress, order.address), "_blank"); }}
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

  if (!active) return null;

  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-sm">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="flex-1 bg-transparent text-sm outline-none w-full"
            placeholder="Tìm theo tên, mã đơn hoặc SĐT khách..."
          />
        </div>
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as any)}
          className="rounded-full border bg-card px-4 py-2.5 text-sm font-medium outline-none hover:bg-secondary cursor-pointer"
        >
          <option value="oldest">Cũ nhất trước</option>
          <option value="newest">Mới nhất trước</option>
        </select>
      </div>

      {myOrders.length === 0 && pendingOrders.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Truck size={48} className="mx-auto mb-4 opacity-20" />
          <p>Chưa có đơn hàng nào cần giao.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section>
            <h2 className="mb-4 font-sans text-xl font-bold">Việc của tôi</h2>
            <div className="space-y-6">
              {sectionedMyOrders.map((section) => {
                if (section.orders.length === 0) return null;
                return (
                  <div key={section.label}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label} ({section.orders.length})
                    </h3>
                    <div className="space-y-4">
                      {section.orders.map((order) => renderOrderCard(order, renderMyAction(order)))}
                    </div>
                  </div>
                );
              })}
              {myOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Bạn chưa nhận đơn nào. Nhận đơn ở cột bên cạnh để bắt đầu.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-xl font-bold">Chờ người giao</h2>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                {pendingOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {pendingOrders.map((order) => renderOrderCard(order, renderAssignAction(order)))}
              {pendingOrders.length === 0 && myOrders.length > 0 && (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Không còn đơn nào đang chờ giao.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
