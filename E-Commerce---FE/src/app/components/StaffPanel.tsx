import {
  AlertTriangle,
  Banknote,
  CakeSlice,
  CheckCircle,
  ClipboardCheck,
  Coffee,
  CreditCard,
  LogOut,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { getAccessToken } from "./authSession";

type StaffPanelProps = {
  onExit: () => void;
  staffUser?: any;
  products?: any[];
  categories?: any[];
};

type PosItem = {
  product: any[];
  quantity: number;
};

const statusTone: Record<string, string> = {
  "Chờ xác nhận": "bg-amber-100 text-amber-700",
  "Xác nhận": "bg-yellow-100 text-yellow-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Chờ shipper": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-green-100 text-green-700",
  "Huỷ": "bg-red-100 text-red-700",
  "Chờ hoàn tiền": "bg-orange-100 text-orange-700",
};

const parsePrice = (value: string | number) => {
  if (typeof value === "number") return value;
  return Number(value.replace(/[^0-9]/g, "")) || 0;
};
const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const mapDbToUiStatus = (order: any) => {
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

function StaffBadge({ status }: { status: string }) {
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

function StaffButton({ children, variant = "primary", onClick, disabled }: any) {
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

function StaffMetric({ label, value, sub, icon: Icon, warn = false }: any) {
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

export function StaffPanel({ onExit, staffUser, products = [], categories = [] }: StaffPanelProps) {
  const [active, setActive] = useState("counter");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosItem[]>([]);

  // API State
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("Mang đi");

  const loadOrders = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/orders`, {
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

  const handlePosCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Chưa có món nào trong hoá đơn");
      return;
    }
    const token = getAccessToken();
    const branchId = staffUser?.branchId || staffUser?.branch?.id;
    if (!branchId) {
      toast.error("Không tìm thấy thông tin chi nhánh của nhân viên");
      return;
    }

    try {
      const payload = {
        branchId,
        shippingAddressPhone: customerPhone,
        shippingRecipientName: "Khách vãng lai",
        shippingFee: 0,
        paymentMethod: paymentMethod === "Tiền mặt" ? "cash" : paymentMethod === "Momo" ? "momo" : "vnpay",
        fulfillmentType: fulfillmentType === "Dùng tại chỗ" ? "dine-in" : "pickup",
        items: cart.map((item) => {
          const uPrice = parsePrice(item.product[1]);
          const pRaw = (item.product as any).raw;
          const pId = pRaw?.id;
          const activeVariants = pRaw?.variants?.filter((v: any) => v.status === "active") || [];
          const vId = activeVariants[0]?.id || pRaw?.variants?.[0]?.id;
          
          if (!pId || !vId) {
            throw new Error(`Sản phẩm ${item.product[0]} bị lỗi dữ liệu (không có ID)`);
          }

          return {
            productId: pId,
            variantId: vId,
            productName: item.product[0],
            variantName: activeVariants[0]?.size || "Mặc định",
            quantity: item.quantity,
            unitPrice: uPrice,
            totalPrice: uPrice * item.quantity,
          };
        }),
      };

      const res = await fetch(`${env.API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success("Thanh toán thành công");
        setCart([]);
        setCustomerPhone("");
        loadOrders();
      } else {
        toast.error(data.message || "Lỗi thanh toán");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối.");
    }
  };

  // Derived arrays based on orders API
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

  const posProducts = useMemo(() => {
    let source = products || [];
    if (activeCategory !== "Tất cả") {
      source = source.filter((item: any[]) => item[2] === activeCategory);
    }
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      source = source.filter((item: any[]) => `${item[0]} ${item[2]}`.toLowerCase().includes(keyword));
    }
    return source.slice(0, 12);
  }, [products, query, activeCategory]);

  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.product[1]) * item.quantity, 0);
  const vat = Math.round(subtotal * 0.03);
  const grandTotal = subtotal + vat;
  const todayRevenue = invoices.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const newOnlineOrders = onlineOrders.filter((o) => o.orderStatus === "pending").length;

  const addToCart = (product: any[]) => {
    setCart((current) => {
      const existing = current.find((item) => item.product[0] === product[0]);
      if (existing) {
        return current.map((item) =>
          item.product[0] === product[0] ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const changeQty = (productName: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product[0] === productName ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const tabs = [
    { key: "counter", label: "Bán tại quầy", icon: Store },
    { key: "online", label: "Đơn online", icon: ShoppingBag },
    { key: "kitchen", label: "Bếp & chuẩn bị", icon: PackageCheck },
    { key: "shift", label: "Bàn giao ca", icon: ClipboardCheck },
  ];

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
            value={kitchenTickets.length}
            sub="Đang chuẩn bị"
            icon={Coffee}
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
          <StaffMetric
            label="Tình trạng"
            value="Ổn định"
            sub="Hệ thống online"
            icon={CheckCircle}
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === key
                  ? "bg-primary text-primary-foreground"
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
            {active === "counter" && (
              <section className="grid gap-5 lg:grid-cols-[1fr_390px]">
                <div className="rounded-2xl border bg-card p-5">
                  <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="flex items-center gap-2 rounded-full border bg-input-background px-3 py-2">
                      <Search size={15} className="text-muted-foreground" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none w-full"
                        placeholder="Tìm sản phẩm, SKU..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Tất cả", ...categories.map(c => c.name)].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                            activeCategory === cat
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-accent"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {posProducts.map((product: any[]) => (
                      <button
                        key={product[0]}
                        type="button"
                        onClick={() => addToCart(product)}
                        className="group overflow-hidden rounded-2xl border bg-background text-left transition hover:border-primary hover:shadow-md"
                      >
                        <img
                          src={product[3]}
                          alt={product[0]}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                              {product[2]}
                            </span>
                            <span className="text-xs text-green-700">Còn hàng</span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 font-sans text-base">{product[0]}</h3>
                          <div className="mt-4 flex items-center justify-between">
                            <b className="text-primary">{product[1]}</b>
                            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                              <Plus size={15} />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-sans text-2xl">Hoá đơn tại quầy</h2>
                      <p className="mt-1 text-xs text-muted-foreground">POS-NEW · Quầy 01</p>
                    </div>
                    <StaffButton variant="ghost">
                      <Printer size={14} /> Tạm giữ
                    </StaffButton>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary w-full"
                      placeholder="SĐT khách hàng"
                    />
                    <select
                      value={fulfillmentType}
                      onChange={(e) => setFulfillmentType(e.target.value)}
                      className="rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary w-full"
                    >
                      <option>Mang đi</option>
                      <option>Dùng tại chỗ</option>
                    </select>
                  </div>

                  <div className="mt-5 space-y-3">
                    {cart.length === 0 && (
                      <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                        Chọn món bên trái để tạo hoá đơn.
                      </div>
                    )}
                    {cart.map((item) => (
                      <div
                        key={item.product[0]}
                        className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.product[0]}</p>
                          <p className="text-xs text-muted-foreground">{item.product[1]}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQty(item.product[0], -1)}
                            className="rounded-full border p-1 transition hover:bg-secondary"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-4 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQty(item.product[0], 1)}
                            className="rounded-full border p-1 transition hover:bg-secondary"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Tiền mặt", "Momo", "VNPay"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        type="button"
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          paymentMethod === method
                            ? "border-primary bg-secondary text-primary"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <div className="my-5 space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <b>{formatMoney(subtotal)}</b>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">VAT</span>
                      <b>{formatMoney(vat)}</b>
                    </p>
                    <p className="flex justify-between border-t pt-3 text-lg font-bold">
                      <span>Tổng</span>
                      <span className="text-primary">{formatMoney(grandTotal)}</span>
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <StaffButton onClick={handlePosCheckout}>
                      <CreditCard size={14} /> Thanh toán
                    </StaffButton>
                    <StaffButton variant="secondary">
                      <Printer size={14} /> In hoá đơn
                    </StaffButton>
                  </div>
                </aside>
              </section>
            )}

            {active === "online" && (
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
                    {onlineOrders.map((order) => {
                      const uiStatus = mapDbToUiStatus(order);
                      const itemsStr =
                        order.items
                          ?.map((i: any) => `${i.quantity}x ${i.productName}`)
                          .join(" · ") || "N/A";

                      return (
                        <article
                          key={order.id}
                          className="rounded-2xl border bg-background p-4 transition hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="font-mono text-xs text-primary">
                                #{order.orderCode} · {order.paymentMethod.toUpperCase()}
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
                            {order.orderStatus === "pending" && (
                              <StaffButton onClick={() => updateOrderStatus(order.id, "confirmed")}>
                                <CheckCircle size={14} /> Xác nhận
                              </StaffButton>
                            )}
                            {order.orderStatus === "confirmed" && (
                              <StaffButton
                                onClick={() => updateOrderStatus(order.id, "preparing")}
                                variant="secondary"
                              >
                                <Coffee size={14} /> Chuyển bếp
                              </StaffButton>
                            )}
                            {order.orderStatus === "preparing" && (
                              <StaffButton
                                onClick={() => updateOrderStatus(order.id, "shipping")}
                                variant="secondary"
                              >
                                <Truck size={14} /> Giao shipper
                              </StaffButton>
                            )}
                            {order.orderStatus !== "completed" && (
                              <StaffButton
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                                variant="danger"
                              >
                                <XCircle size={14} /> Huỷ
                              </StaffButton>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border bg-card p-5">
                  <h2 className="font-sans text-xl font-semibold">Ưu tiên xử lý</h2>
                  <div className="mt-4 space-y-3">
                    {onlineOrders.slice(0, 5).map((order) => (
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
            )}

            {active === "kitchen" && (
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
                    const columnOrders = kitchenTickets.filter((o) => o.orderStatus === statusKey);

                    return (
                      <div key={statusKey} className="rounded-2xl bg-secondary p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="font-sans text-lg font-semibold">{statusName}</h2>
                          <span className="text-xs text-muted-foreground">
                            {columnOrders.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {columnOrders.map((ticket) => (
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
            )}

            {active === "shift" && (
              <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div className="rounded-2xl border bg-card p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-3xl font-semibold">Bàn giao ca</h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tổng hợp tiền mặt, hoá đơn, tồn kho và việc cần xử lý.
                      </p>
                    </div>
                    <StaffButton>
                      <ClipboardCheck size={14} /> Chốt ca
                    </StaffButton>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-secondary">
                          <th className="p-3">Mã</th>
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3">Tổng</th>
                          <th className="p-3">Thanh toán</th>
                          <th className="p-3">Giờ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-5 text-center text-muted-foreground">
                              Chưa có hoá đơn nào trong ngày.
                            </td>
                          </tr>
                        )}
                        {invoices.map((invoice) => {
                          const itemsStr =
                            invoice.items
                              ?.map((i: any) => `${i.quantity}x ${i.productName}`)
                              .join(", ") || "N/A";
                          return (
                            <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 transition">
                              <td className="p-3 font-mono text-primary">#{invoice.orderCode}</td>
                              <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                                {itemsStr}
                              </td>
                              <td className="p-3 font-semibold">
                                {formatMoney(Number(invoice.totalAmount))}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {invoice.paymentMethod.toUpperCase()}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {new Date(invoice.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border bg-card p-5">
                  <h2 className="font-sans text-xl font-semibold">Checklist cuối ca</h2>
                  <div className="mt-4 space-y-3">
                    {[
                      "Đối soát tiền mặt và ví điện tử",
                      "Cập nhật món hết hàng",
                      "Ghi chú bánh đặt trước",
                      "Vệ sinh quầy cafe và tủ bánh",
                    ].map((task, index) => (
                      <label
                        key={task}
                        className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary p-3 text-sm transition hover:bg-accent"
                      >
                        <input type="checkbox" defaultChecked={index < 2} className="mt-1" />
                        <span>{task}</span>
                      </label>
                    ))}
                  </div>
                </aside>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
