import { Check, Minus, Plus, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { parseRes } from "../../../utils/api";
import { getAccessToken } from "../authSession";
import { printInvoice } from "./invoicePrint";
import type { InvoicePrintData } from "./invoicePrint";
import { StaffButton, formatMoney } from "./StaffShared";

type PosItem = {
  product: any[];
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
};

export function PosTab({ products, categories, branchId, loadOrders, refreshProducts, active }: any) {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosItem[]>([]);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any[] | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("Mang đi");
  const [showQrModal, setShowQrModal] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<InvoicePrintData | null>(null);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any>(null);
  const [checkoutSuccessInvoice, setCheckoutSuccessInvoice] = useState<InvoicePrintData | null>(null);

  const posProducts = useMemo(() => {
    let source = products || [];
    if (activeCategory !== "Tất cả") {
      source = source.filter((item: any[]) => item[2] === activeCategory);
    }
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      source = source.filter((item: any[]) => `${item[0]} ${item[2]}`.toLowerCase().includes(keyword));
    }
    return source;
  }, [products, query, activeCategory]);

  const categoryOptions = useMemo(
    () => [...new Set(
      [
        ...(categories || [])
          .filter((category: any) => category.isActive !== false)
          .map((category: any) => String(category.name || '').trim()),
        ...(products || []).map((product: any[]) => String(product[2] || '').trim()),
      ]
        .filter(Boolean),
    )],
    [categories, products],
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.03);
  const grandTotal = subtotal + vat;

  const buildDraftInvoice = (): InvoicePrintData => ({
    items: cart.map(item => ({
      name: item.product[0],
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    })),
    subtotal,
    vat,
    total: grandTotal,
    paymentMethod,
    customerPhone,
    fulfillmentType,
    paid: false,
  });

  const printCurrentInvoice = (invoice: InvoicePrintData) => {
    if (!printInvoice(invoice)) toast.error("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.");
  };

  const addToCart = (product: any[], variant?: any) => {
    const raw = (product as any).raw || {};
    const displayVariants = raw.variants?.filter((v: any) => v.status !== "inactive") || [];
    const activeVariants = displayVariants.filter((v: any) => v.status === "active");
    const hasInventoryData = activeVariants.some((v: any) =>
      Object.prototype.hasOwnProperty.call(v, "availableQuantity"),
    );
    const availableVariants = activeVariants.filter((v: any) =>
      !hasInventoryData || Number(v.availableQuantity ?? 0) > 0,
    );
    
    if (!variant) {
      if (displayVariants.length > 1) {
        setSelectedProductForVariant(product);
        return;
      }
      variant = availableVariants[0];
    }
    
    if (!variant || variant.status !== "active"
      || (hasInventoryData && Number(variant.availableQuantity ?? 0) <= 0)) {
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
    if (delta > 0) {
      const item = cart.find((current) => current.product[0] === productName && current.variantId === variantId);
      const variant = (item?.product as any)?.raw?.variants?.find((candidate: any) => candidate.id === variantId);
      if (variant && Object.prototype.hasOwnProperty.call(variant, "availableQuantity")) {
        const availableQuantity = Math.max(0, Number(variant.availableQuantity ?? 0));
        if (item && item.quantity >= availableQuantity) {
          toast.error(`Tồn kho chỉ còn ${availableQuantity} sản phẩm cho phiên bản này.`);
          return;
        }
      }
    }
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
        subtotal: grandTotal,
        totalAmount: grandTotal,
        shippingAddressPhone: customerPhone,
        shippingRecipientName: "Khách vãng lai",
        shippingFee: 0,
        paymentMethod: paymentMethod === "Tiền mặt" ? "cash" : paymentMethod === "Momo" ? "momo" : "vnpay",
        // The orders enum supports pickup/delivery. Dine-in is a POS pickup
        // without shipping, so persist it as pickup while keeping the local
        // label for the receipt and staff UI.
        fulfillmentType: "pickup",
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

      const res = await fetch(`${env.API_URL}/admin/orders/pos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await parseRes(res);
      if (res.ok) {
        const draftInvoice = buildDraftInvoice();
        setCheckoutSuccessOrder(data);
        setCheckoutSuccessInvoice({ ...draftInvoice, orderCode: data.orderCode, paid: true });
        setCart([]);
        setCustomerPhone("");
        loadOrders();
        await refreshProducts?.();
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
            <label className="flex min-w-0 items-center gap-2 rounded-full border bg-input-background px-3 py-2">
              <span className="sr-only">Lọc theo danh mục</span>
              <select
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              >
                <option value="Tất cả">Tất cả danh mục</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {posProducts.map((product: any) => {
              const activeVariants = ((product.raw?.variants || []) as any[])
                .filter((variant: any) => variant.status === "active");
              const hasInventoryData = activeVariants.some((variant: any) =>
                Object.prototype.hasOwnProperty.call(variant, "availableQuantity"),
              );
              const availableQuantity = hasInventoryData
                ? activeVariants.reduce(
                    (sum: number, variant: any) => sum + Math.max(0, Number(variant.availableQuantity ?? 0)),
                    0,
                  )
                : 0;
              const isOutOfStock = product.raw?.isActive === false
                || activeVariants.length === 0
                || !hasInventoryData
                || availableQuantity <= 0;
              const availabilityLabel = !hasInventoryData
                ? "Chưa có tồn kho"
                : isOutOfStock ? "Hết hàng" : `Còn ${availableQuantity}`;
              const activeVariantCount = activeVariants.length;
              const variantLabel = activeVariantCount > 1
                ? `${activeVariantCount} kích cỡ`
                : activeVariantCount === 1 ? "1 kích cỡ" : "Không có phiên bản";
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
                      <span className={`text-xs font-semibold ${isOutOfStock ? "text-red-600" : "text-green-700"}`}>{availabilityLabel}</span>
                    </div>
                    <h3 className={`mt-3 line-clamp-2 font-sans text-base ${isOutOfStock ? "text-muted-foreground" : ""}`}>{product[0]}</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div>
                          <b className={isOutOfStock ? "text-muted-foreground" : "text-primary"}>{product[1]}</b>
                          <p className="text-[11px] text-muted-foreground">{variantLabel}</p>
                        </div>
                        <span className={`grid size-8 place-items-center rounded-full ${isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                          <Plus size={15} />
                        </span>
                      </div>
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
            <StaffButton
              variant="ghost"
              onClick={() => setInvoicePreview(buildDraftInvoice())}
              disabled={cart.length === 0}
            >
              <Printer size={14} /> In trước thanh toán
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
            <StaffButton
              variant="ghost"
              onClick={() => setInvoicePreview(buildDraftInvoice())}
              disabled={cart.length === 0}
              className="w-full"
            >
              <Printer size={14} /> Xem và in hóa đơn
            </StaffButton>
            <StaffButton onClick={onCheckoutClick} className="w-full">
              Xác nhận thanh toán
            </StaffButton>
          </div>
        </aside>
      </section>

      {invoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Hóa đơn tạm tính</h3>
                <p className="mt-1 text-xs text-muted-foreground">Chưa thanh toán · kiểm tra trước khi thu tiền</p>
              </div>
              <button type="button" onClick={() => setInvoicePreview(null)} className="rounded-full border px-3 py-1 text-sm">Đóng</button>
            </div>
            <div className="mt-5 space-y-3">
              {invoicePreview.items.map((item, index) => (
                <div key={`${item.name}-${item.variantName}-${index}`} className="flex items-start justify-between gap-3 border-b pb-2 text-sm">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.variantName} · {item.quantity} x {formatMoney(item.unitPrice)}</p>
                  </div>
                  <span className="font-semibold">{formatMoney(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t pt-3 text-sm">
              <p className="flex justify-between"><span>Tạm tính</span><b>{formatMoney(invoicePreview.subtotal)}</b></p>
              <p className="flex justify-between"><span>VAT (3%)</span><b>{formatMoney(invoicePreview.vat)}</b></p>
              <p className="flex justify-between text-lg font-bold"><span>Tổng cộng</span><span className="text-primary">{formatMoney(invoicePreview.total)}</span></p>
            </div>
            <button
              type="button"
              onClick={() => printCurrentInvoice(invoicePreview)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              <Printer size={16} /> In hóa đơn trước thanh toán
            </button>
          </div>
        </div>
      )}
      
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
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => checkoutSuccessInvoice && printCurrentInvoice(checkoutSuccessInvoice)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border py-3 font-semibold transition hover:bg-secondary"
                >
                  <Printer size={16} /> In lại hóa đơn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutSuccessOrder(null);
                    setCheckoutSuccessInvoice(null);
                  }}
                  className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/80"
                >
                  Tạo đơn mới
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProductForVariant && (() => {
        const product = selectedProductForVariant;
        const raw = (product as any).raw || {};
        const activeVariants = raw.variants?.filter((v: any) => v.status === "active") || [];
        const hasInventoryData = activeVariants.some((v: any) =>
          Object.prototype.hasOwnProperty.call(v, "availableQuantity"),
        );
        const availableVariants = activeVariants.filter((v: any) =>
          !hasInventoryData || Number(v.availableQuantity ?? 0) > 0,
        );

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
                {availableVariants.length === 0 && (
                  <p className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
                    Sản phẩm hiện đã hết tồn kho tại chi nhánh.
                  </p>
                )}
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
