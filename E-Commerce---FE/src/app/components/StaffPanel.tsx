import { useMemo, useState } from "react";
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
} from "lucide-react";

type StaffPanelProps = {
  onExit: () => void;
  staffUser?: any;
  products?: any[];
};

type PosItem = {
  product: any[];
  quantity: number;
};

const onlineOrders = [
  {
    id: "#SB1028",
    customer: "Nguyễn Minh Anh",
    phone: "0909 888 777",
    address: "12 Pasteur, Quận 1",
    channel: "Website",
    payment: "Momo đã thanh toán",
    items: ["Bánh Tiramisu x1", "Cafe Latte M x1"],
    total: "100.000đ",
    status: "Chờ xác nhận",
    sla: "12 phút",
    note: "Ít ngọt, giao trước 15:30",
  },
  {
    id: "#SB1027",
    customer: "Trần Thị Bình",
    phone: "0912 345 678",
    address: "Nhận tại quầy",
    channel: "App",
    payment: "COD",
    items: ["Bánh sinh nhật socola 6 inch"],
    total: "350.000đ",
    status: "Đang chuẩn bị",
    sla: "28 phút",
    note: "Ghi chữ Happy Birthday Bo",
  },
  {
    id: "#SB1026",
    customer: "Phạm Thu Hà",
    phone: "0901 112 233",
    address: "45 Lê Lợi, Quận 1",
    channel: "Hotline",
    payment: "VNPay đã thanh toán",
    items: ["Matcha Latte M x2", "Cookie bơ x1"],
    total: "158.000đ",
    status: "Chờ shipper",
    sla: "7 phút",
    note: "Tách đá riêng",
  },
];

const kitchenTickets = [
  { id: "K-24", title: "Bánh sinh nhật socola", order: "#SB1027", station: "Bánh kem", due: "15:10", status: "Đang làm" },
  { id: "K-23", title: "Latte M + Tiramisu", order: "#SB1028", station: "Cafe", due: "14:52", status: "Chờ bếp" },
  { id: "K-22", title: "Matcha Latte x2", order: "#SB1026", station: "Đồ uống", due: "14:45", status: "Sẵn sàng" },
];

const invoices = [
  { id: "#POS2051", items: "Latte M x2, Tiramisu x1", total: "155.000đ", pay: "Momo", time: "14:20" },
  { id: "#POS2050", items: "Cold Brew x1, Cookie x2", total: "140.000đ", pay: "Tiền mặt", time: "13:55" },
  { id: "#POS2049", items: "Combo Tiramisu + Latte", total: "89.000đ", pay: "VNPay", time: "13:10" },
];

const statusTone: Record<string, string> = {
  "Chờ xác nhận": "bg-amber-100 text-amber-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Chờ shipper": "bg-blue-100 text-blue-700",
  "Chờ bếp": "bg-amber-100 text-amber-700",
  "Đang làm": "bg-blue-100 text-blue-700",
  "Sẵn sàng": "bg-green-100 text-green-700",
};

const parsePrice = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

function StaffBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function StaffButton({ children, variant = "primary", onClick }: any) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/80"
      : variant === "danger"
        ? "bg-red-100 text-red-700 hover:bg-red-200"
        : variant === "ghost"
          ? "border bg-card hover:bg-secondary"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80";

  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${cls}`}>
      {children}
    </button>
  );
}

function StaffMetric({ label, value, sub, icon: Icon, warn = false }: any) {
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

export function StaffPanel({ onExit, staffUser, products = [] }: StaffPanelProps) {
  const [active, setActive] = useState("counter");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosItem[]>([]);

  const posProducts = useMemo(() => {
    const source = products.length > 0 ? products : [
      ["Cafe Latte", "55.000đ", "Cafe", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=220&h=160&fit=crop&auto=format", "4.8", "Còn hàng"],
      ["Cold Brew", "60.000đ", "Cafe", "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=220&h=160&fit=crop&auto=format", "4.8", "Còn hàng"],
      ["Tiramisu lát", "45.000đ", "Bánh", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=220&h=160&fit=crop&auto=format", "4.9", "Còn hàng"],
      ["Bánh tart trứng", "25.000đ", "Bánh", "https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=220&h=160&fit=crop&auto=format", "4.7", "Còn hàng"],
      ["Combo Tiramisu + Latte", "89.000đ", "Combo", "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=220&h=160&fit=crop&auto=format", "4.9", "Combo"],
    ];

    const keyword = query.trim().toLowerCase();
    if (!keyword) return source.slice(0, 12);
    return source.filter((item: any[]) => `${item[0]} ${item[2]}`.toLowerCase().includes(keyword)).slice(0, 12);
  }, [products, query]);

  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.product[1]) * item.quantity, 0);
  const vat = Math.round(subtotal * 0.03);
  const grandTotal = subtotal + vat;

  const addToCart = (product: any[]) => {
    setCart((current) => {
      const existing = current.find((item) => item.product[0] === product[0]);
      if (existing) {
        return current.map((item) => item.product[0] === product[0] ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const changeQty = (productName: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) => item.product[0] === productName ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0),
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
                {staffUser?.fullName || staffUser?.email || "Nhân viên"} · POS bán hàng tại quán
              </p>
            </div>
          </div>

          <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            <LogOut size={15} /> Thoát
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-5 py-6">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StaffMetric label="Đơn online mới" value="8" sub="3 đơn cần xác nhận" icon={ShoppingBag} />
          <StaffMetric label="SLA gần trễ" value="2" sub="Dưới 10 phút" icon={AlertTriangle} warn />
          <StaffMetric label="Hoá đơn POS" value="24" sub="Trong ca hiện tại" icon={ReceiptText} />
          <StaffMetric label="Doanh thu ca" value={formatMoney(4820000)} sub="+12% so hôm qua" icon={Banknote} />
          <StaffMetric label="Cảnh báo kho" value="3" sub="Sắp hết hoặc gần hạn" icon={PackageCheck} warn />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active === key ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {active === "counter" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="flex items-center gap-2 rounded-full border bg-input-background px-3 py-2">
                  <Search size={15} className="text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="Tìm sản phẩm, SKU, combo..." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Tất cả", "Bánh", "Cafe", "Trà", "Combo"].map((cat, index) => (
                    <button key={cat} type="button" className={`rounded-full px-3 py-2 text-xs font-semibold transition ${index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {posProducts.map((product: any[]) => (
                  <button key={product[0]} type="button" onClick={() => addToCart(product)} className="group overflow-hidden rounded-2xl border bg-background text-left transition hover:border-primary hover:shadow-md">
                    <img src={product[3]} alt={product[0]} className="h-32 w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{product[2]}</span>
                        <span className="text-xs text-green-700">{product[5] || "Còn hàng"}</span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-sans text-base">{product[0]}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <b className="text-primary">{product[1]}</b>
                        <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Plus size={15} /></span>
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
                <StaffButton variant="ghost"><Printer size={14} />Tạm giữ</StaffButton>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input className="rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary" placeholder="SĐT khách hàng" />
                <select className="rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary">
                  <option>Mang đi</option>
                  <option>Dùng tại chỗ</option>
                  <option>Đặt lấy sau</option>
                </select>
              </div>

              <div className="mt-5 space-y-3">
                {cart.length === 0 && (
                  <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    Chọn món bên trái để tạo hoá đơn.
                  </div>
                )}
                {cart.map((item) => (
                  <div key={item.product[0]} className="flex items-center justify-between gap-3 border-b pb-3">
                    <div>
                      <p className="font-medium">{item.product[0]}</p>
                      <p className="text-xs text-muted-foreground">{item.product[1]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeQty(item.product[0], -1)} className="rounded-full border p-1 transition hover:bg-secondary"><Minus size={12} /></button>
                      <span className="w-4 text-center text-sm">{item.quantity}</span>
                      <button type="button" onClick={() => changeQty(item.product[0], 1)} className="rounded-full border p-1 transition hover:bg-secondary"><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <input className="mt-4 w-full rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary" placeholder="Mã voucher / thẻ thành viên" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Tiền mặt", "Momo", "VNPay"].map((method, index) => (
                  <button key={method} type="button" className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${index === 0 ? "border-primary bg-secondary text-primary" : "hover:bg-secondary"}`}>{method}</button>
                ))}
              </div>

              <div className="my-5 space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><b>{formatMoney(subtotal)}</b></p>
                <p className="flex justify-between"><span className="text-muted-foreground">VAT</span><b>{formatMoney(vat)}</b></p>
                <p className="flex justify-between border-t pt-3 text-lg font-bold"><span>Tổng</span><span className="text-primary">{formatMoney(grandTotal)}</span></p>
              </div>

              <div className="grid gap-2">
                <StaffButton><CreditCard size={14} />Thanh toán</StaffButton>
                <StaffButton variant="secondary"><Printer size={14} />In hoá đơn</StaffButton>
              </div>
            </aside>
          </section>
        )}

        {active === "online" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-5">
                <h1 className="text-3xl">Xử lý đơn online</h1>
                <p className="mt-1 text-sm text-muted-foreground">Xác nhận đơn, chuyển bếp, điều phối shipper và cập nhật trạng thái cho khách.</p>
              </div>
              <div className="space-y-3">
                {onlineOrders.map((order) => (
                  <article key={order.id} className="rounded-2xl border bg-background p-4 transition hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-primary">{order.id} · {order.channel} · SLA {order.sla}</p>
                        <h3 className="mt-1 font-sans text-base">{order.customer}</h3>
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Phone size={13} />{order.phone}</span>
                          <span>{order.address}</span>
                        </p>
                      </div>
                      <StaffBadge status={order.status} />
                    </div>
                    <div className="mt-4 grid gap-3 rounded-xl bg-secondary p-3 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-sm font-medium">{order.items.join(" · ")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{order.note}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="font-semibold text-primary">{order.total}</p>
                        <p className="text-xs text-muted-foreground">{order.payment}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StaffButton><CheckCircle size={14} />Xác nhận</StaffButton>
                      <StaffButton variant="secondary"><Coffee size={14} />Chuyển bếp</StaffButton>
                      <StaffButton variant="secondary"><Truck size={14} />Gọi shipper</StaffButton>
                      <StaffButton variant="danger"><XCircle size={14} />Huỷ</StaffButton>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border bg-card p-5">
              <h2 className="font-sans text-xl">Ưu tiên xử lý</h2>
              <div className="mt-4 space-y-3">
                {onlineOrders.map((order) => (
                  <div key={order.id} className="rounded-xl bg-secondary p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs text-primary">{order.id}</p>
                      <span className="text-xs text-muted-foreground">{order.sla}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{order.items[0]}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {active === "kitchen" && (
          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-5">
              <h1 className="text-3xl">Bếp & chuẩn bị</h1>
              <p className="mt-1 text-sm text-muted-foreground">Phiếu bếp theo trạm, giờ hẹn và trạng thái sẵn sàng giao/nhận.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {["Chờ bếp", "Đang làm", "Sẵn sàng"].map((status) => (
                <div key={status} className="rounded-2xl bg-secondary p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-sans text-lg">{status}</h2>
                    <StaffBadge status={status} />
                  </div>
                  <div className="space-y-3">
                    {kitchenTickets.filter((ticket) => ticket.status === status).map((ticket) => (
                      <article key={ticket.id} className="rounded-xl border bg-card p-4 shadow-sm">
                        <p className="font-mono text-xs text-primary">{ticket.id} · {ticket.order}</p>
                        <h3 className="mt-1 font-medium">{ticket.title}</h3>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{ticket.station}</span>
                          <span>{ticket.due}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {active === "shift" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl">Bàn giao ca</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Tổng hợp tiền mặt, hoá đơn, tồn kho và việc cần xử lý cho ca sau.</p>
                </div>
                <StaffButton><ClipboardCheck size={14} />Chốt ca</StaffButton>
              </div>
              <div className="overflow-auto rounded-2xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary text-left">
                      <th className="p-3">Mã</th>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3">Tổng</th>
                      <th className="p-3">Thanh toán</th>
                      <th className="p-3">Giờ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-0">
                        <td className="p-3 font-mono text-primary">{invoice.id}</td>
                        <td className="p-3 text-muted-foreground">{invoice.items}</td>
                        <td className="p-3 font-semibold">{invoice.total}</td>
                        <td className="p-3 text-muted-foreground">{invoice.pay}</td>
                        <td className="p-3 text-muted-foreground">{invoice.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="rounded-2xl border bg-card p-5">
              <h2 className="font-sans text-xl">Checklist cuối ca</h2>
              <div className="mt-4 space-y-3">
                {["Đối soát tiền mặt và ví điện tử", "Cập nhật món hết hàng", "Ghi chú bánh đặt trước", "Vệ sinh quầy cafe và tủ bánh"].map((task, index) => (
                  <label key={task} className="flex items-start gap-3 rounded-xl bg-secondary p-3 text-sm">
                    <input type="checkbox" defaultChecked={index < 2} className="mt-1" />
                    <span>{task}</span>
                  </label>
                ))}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
