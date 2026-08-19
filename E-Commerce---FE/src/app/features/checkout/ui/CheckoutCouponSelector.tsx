import { Check, ChevronRight, Ticket, X } from "lucide-react";

interface CouponOption {
  id: string;
  code: string;
  description?: string;
  minOrderValue?: number | string;
  discountType: "percent" | "fixed";
  discountValue: number | string;
  maxDiscount?: number | string;
  isApplicable: boolean;
  unavailableReason: string;
}

interface CheckoutCouponSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  couponOptions: CouponOption[];
  appliedCoupon: CouponOption | null;
  onSelectCoupon: (coupon: CouponOption) => void;
  onRemoveCoupon: () => void;
}

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

export function CheckoutCouponSelector({
  isOpen,
  onOpenChange,
  couponOptions,
  appliedCoupon,
  onSelectCoupon,
  onRemoveCoupon,
}: CheckoutCouponSelectorProps) {
  return (
    <>
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Ticket size={18} /> Mã giảm giá
        </h3>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex w-full items-center justify-between rounded-xl border bg-input px-4 py-3 text-left transition hover:border-primary"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Ticket size={17} />
            </span>
            {appliedCoupon ? (
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">Đang áp dụng</span>
                <span className="block text-sm font-bold text-primary font-mono break-all">{appliedCoupon.code}</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground truncate">Chọn ưu đãi cho đơn hàng</span>
            )}
          </span>
          <ChevronRight className="shrink-0 text-muted-foreground" size={19} />
        </button>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[min(85vh,38rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-bold">Chọn mã giảm giá</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Ưu đãi phù hợp được hiển thị trước</p>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-muted">
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {couponOptions.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Hiện chưa có mã giảm giá khả dụng.</p>
              ) : (
                couponOptions.map((coupon) => {
                  const selected = appliedCoupon?.id === coupon.id;
                  return (
                    <button
                      key={coupon.id}
                      type="button"
                      disabled={!coupon.isApplicable}
                      onClick={() => onSelectCoupon(coupon)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        !coupon.isApplicable
                          ? "cursor-not-allowed bg-muted/40 opacity-55"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">
                        {coupon.discountType === "percent"
                          ? `${Number(coupon.discountValue)}%`
                          : `${Number(coupon.discountValue) / 1000}k`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold font-mono text-sm break-all">{coupon.code}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {coupon.unavailableReason ||
                            coupon.description ||
                            `Đơn tối thiểu ${formatPrice(Number(coupon.minOrderValue || 0))}`}
                        </span>
                        {Number(coupon.maxDiscount || 0) > 0 && (
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            Giảm tối đa {formatPrice(Number(coupon.maxDiscount))}
                          </span>
                        )}
                      </span>
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {appliedCoupon && (
              <div className="border-t p-4">
                <button type="button" onClick={onRemoveCoupon} className="w-full rounded-xl bg-muted py-3 text-sm font-semibold hover:bg-muted/80">
                  Không dùng mã giảm giá
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
