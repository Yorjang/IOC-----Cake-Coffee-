import { Check, Minus, Plus, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { parseRes } from "../../../utils/api";
import { getAccessToken } from "../authSession";
import { StaffButton, formatMoney } from "./StaffShared";

type PosItem = {
  product: any[];
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
};

export function PosTab({ products, categories, branchId, loadOrders, active }: any) {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosItem[]>([]);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any[] | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("Mang đi");
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any>(null);

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.03);
  const grandTotal = subtotal + vat;

  const addToCart = (product: any[], variant?: any) => {
    const raw = (product as any).raw || {};
    const displayVariants = raw.variants?.filter((v: any) => v.status !== "inactive") || [];
    const availableVariants = displayVariants.filter((v: any) => v.status === "active");
    
    if (!variant) {
      if (displayVariants.length > 1) {
        setSelectedProductForVariant(product);
        return;
      }
      variant = availableVariants[0];
    }
    
    if (!variant || variant.status !== "active") {
      toast.error("Sản phẩm đã hết hàng hoặc không có dữ liệu phiên bản");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product[0] === product[0] && item.variantId === variant.id);
      if (existing) {
        return current.map((item) =>
          item.product[0] === product[0] && item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { 
        product, 
        variantId: variant.id, 
        variantName: variant.size || variant.variantName || "Mặc định", 
        price: Number(variant.price), 
        quantity: 1 
      }];
    });
    setSelectedProductForVariant(null);
  };

  const changeQty = (productName: string, variantId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product[0] === productName && item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handlePosCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Chưa có món nào trong hoá đơn");
      return;
    }
    const token = getAccessToken();
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
          const pRaw = (item.product as any).raw;
          const pId = pRaw?.id;
          
          if (!pId || !item.variantId) {
            throw new Error(`Sản phẩm ${item.product[0]} bị lỗi dữ liệu (không có ID)`);
          }

          return {
            productId: pId,
            variantId: item.variantId,
            productName: item.product[0],
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
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
        setCheckoutSuccessOrder(data);
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

  const onCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error("Chưa có món nào trong hoá đơn");
      return;
    }
    if (paymentMethod === "Momo" || paymentMethod === "VNPay") {
      setShowQrModal(true);
    } else {
      handlePosCheckout();
    }
  };

  return (
    <div className={active ? "block" : "hidden"}>
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
              {["Tất cả", ...categories.map((c: any) => c.name)].map((cat) => (
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
            {posProducts.map((product: any) => {
              const isOutOfStock = product[5] === "Hết hàng" || (product.raw && product.raw.isActive === false);
              return (
                <button
                  key={product[0]}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => { if (!isOutOfStock) addToCart(product) }}
                  className={`group overflow-hidden rounded-2xl border bg-background text-left transition ${
                    isOutOfStock ? "opacity-50 pointer-events-none grayscale" : "hover:border-primary hover:shadow-md"
                  }`}
                >
                  <img
                    src={product[3]}
                    alt={product[0]}
                    className={`h-32 w-full object-cover transition duration-300 ${!isOutOfStock ? "group-hover:scale-105" : ""}`}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        {product[2]}
                      </span>
                      <span className={`text-xs ${product[5] === "Hết hàng" ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}`}>{product[5]}</span>
                    </div>
                    <h3 className={`mt-3 line-clamp-2 font-sans text-base ${isOutOfStock ? "text-muted-foreground" : ""}`}>{product[0]}</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <b className={isOutOfStock ? "text-muted-foreground" : "text-primary"}>{product[1]}</b>
                      <span className={`grid size-8 place-items-center rounded-full ${isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                        <Plus size={15} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
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
                key={`${item.product[0]}-${item.variantId}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">{item.product[0]}</p>
                  <p className="text-xs text-muted-foreground">{item.variantName !== "Mặc định" ? `Size: ${item.variantName} · ` : ""}{formatMoney(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQty(item.product[0], item.variantId, -1)}
                    className="rounded-full border p-1 transition hover:bg-secondary"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(item.product[0], item.variantId, 1)}
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
            <p className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Tổng</span>
              <span className="text-primary">{formatMoney(grandTotal)}</span>
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-1 mt-4">
            <StaffButton onClick={onCheckoutClick} className="w-full">
              Xác nhận thanh toán
            </StaffButton>
          </div>
        </aside>
      </section>
      
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <h3 className="text-center text-xl font-bold">Thanh toán {paymentMethod}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Vui lòng quét mã QR dưới đây bằng ứng dụng {paymentMethod} để thanh toán hoá đơn.
            </p>
            
            <div className="my-6 mx-auto flex aspect-square w-48 items-center justify-center rounded-xl bg-white p-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pay_${grandTotal}_${paymentMethod}`} 
                alt="QR Code" 
                className="h-full w-full object-contain"
              />
            </div>
            
            <div className="mb-6 rounded-xl bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
              <p className="text-2xl font-bold text-primary">{formatMoney(grandTotal)}</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => {
                  setShowQrModal(false);
                  handlePosCheckout();
                }}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80"
              >
                Đã thanh toán thành công
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full rounded-full border py-3 text-sm font-semibold transition hover:bg-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {checkoutSuccessOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-bold">Thanh toán thành công!</h3>
            <p className="mt-2 text-muted-foreground">
              Đơn hàng #{checkoutSuccessOrder.orderCode} đã được ghi nhận.
            </p>
            
            <div className="mt-6">
              <button
                onClick={() => setCheckoutSuccessOrder(null)}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/80"
              >
                Tạo đơn mới
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProductForVariant && (() => {
        const product = selectedProductForVariant;
        const raw = (product as any).raw || {};
        const availableVariants = raw.variants?.filter((v: any) => v.status === "active") || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
              <h3 className="text-xl font-bold">{product[0]}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Vui lòng chọn phân loại để thêm vào giỏ.</p>
              
              <div className="mt-5 grid gap-3">
                {availableVariants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => addToCart(product, v)}
                    className="flex items-center justify-between rounded-xl border p-3 hover:bg-secondary transition"
                  >
                    <span className="font-semibold">{v.size || v.variantName}</span>
                    <span className="text-primary">{formatMoney(Number(v.price))}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setSelectedProductForVariant(null)}
                  className="w-full rounded-full border py-3 text-sm font-semibold transition hover:bg-secondary"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
