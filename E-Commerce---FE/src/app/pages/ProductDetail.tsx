import { Heart, Minus, Plus, Star, Check } from "lucide-react";
import { Btn, ProductCard } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";
import { useProductDetail } from "../features/products/hooks/useProductDetail";
import { ComboContents, type ComboContentItem } from "../features/products/ui/ComboContents";

const formatPrice = (priceNum: number): string => {
  return priceNum.toLocaleString("vi-VN") + "đ";
};

const SUGAR_OPTIONS = ["100%", "70%", "50%", "30%"];
const ICE_OPTIONS = ["100%", "70%", "50%", "Không đá"];

export function ProductDetail(props: any) {
  const { setView, onToggleWishlist, onSelectProduct, wishlist, onAddToCart } = props;
  const {
    p, isDrink, isBirthdayCake,
    availableVariants, toppingOptions,
    selectedVariantId, setSelectedVariantId,
    sugar, setSugar,
    ice, setIce,
    selectedToppings,
    comboDrinkOptions,
    customText, setCustomText,
    needCandles, setNeedCandles,
    quantity, setQuantity,
    selectedVariant, isWishlisted,
    related,
    unitPrice,
    discountedPrice, discountAmount, bestCoupon, totalPriceStr,
    toggleTopping, updateComboDrinkOption, toggleComboDrinkTopping, handleAdd
  } = useProductDetail(props);
  const isCombo = p[2] === VIEW_KEYS.COMBO;
  const comboItems: ComboContentItem[] = Array.isArray(p.raw?.items) ? p.raw.items : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setView(VIEW_KEYS.HOME)} className="hover:text-primary transition">Trang chủ</button>
        <span>/</span>
        <button onClick={() => setView(p[2])} className="hover:text-primary transition">{p[2]}</button>
        <span>/</span>
        <span className="text-foreground font-semibold">{p[0]}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Left Column: Image */}
        <div className="overflow-hidden rounded-3xl border bg-muted relative aspect-square max-h-[500px] shadow-sm">
          <img src={(selectedVariant?.imageUrl || p[3]) as string} alt={p[0] as string} className="w-full h-full object-cover" />
          <button
            onClick={() => onToggleWishlist(p)}
            className={`absolute right-4 top-4 rounded-full p-3 transition shadow-md ${isWishlisted ? "bg-rose-100 text-rose-500" : "bg-card/95 hover:bg-accent text-foreground"}`}
          >
            <Heart size={20} className={isWishlisted ? "fill-rose-500" : ""} />
          </button>
        </div>

        {/* Right Column: Info & Options */}
        <div className="space-y-6">
          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{p[2]}</span>
            <h1 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-foreground">{p[0]}</h1>

            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex items-center text-amber-500 text-sm font-semibold gap-1">
                <Star size={16} className="fill-amber-500 text-amber-500" /> {p[4]}
              </span>
              <span className="text-muted-foreground text-sm">|</span>
              <button onClick={() => setView(VIEW_KEYS.REVIEW)} className="text-primary hover:underline text-sm font-semibold transition">
                Xem đánh giá của khách hàng
              </button>
            </div>

            {discountAmount > 0 && bestCoupon ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-primary">{formatPrice(discountedPrice)}</span>
                <span className="text-base text-muted-foreground line-through">{formatPrice(unitPrice)}</span>
                <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400 font-bold">
                  Mã {bestCoupon.code} giảm {bestCoupon.discountType === 'percent' ? `${Math.round(Number(bestCoupon.discountValue))}%` : formatPrice(Number(bestCoupon.discountValue))}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-3xl font-bold text-primary">{formatPrice(unitPrice)}</p>
            )}
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              {p.raw?.description?.trim() || "Sản phẩm được chế biến từ những nguyên liệu chất lượng cao, được lựa chọn kỹ lưỡng mỗi ngày. Đảm bảo mang lại hương vị trọn vẹn và trải nghiệm ẩm thực tuyệt vời nhất cho quý khách."}
            </p>
          </div>

          <hr className="border-border" />

          {isCombo ? (
            <ComboContents
              items={comboItems}
              drinkOptions={comboDrinkOptions}
              sugarOptions={SUGAR_OPTIONS}
              iceOptions={ICE_OPTIONS}
              onDrinkOptionChange={updateComboDrinkOption}
              onComboDrinkToppingToggle={toggleComboDrinkTopping}
            />
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Kích cỡ</h3>
              {availableVariants.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((variant: any) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${selectedVariant?.id === variant.id ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary/50 text-foreground"}`}
                    >
                      <span>{variant.size || variant.variantName}</span>
                      <span className="ml-2 text-xs opacity-75">{formatPrice(Number(variant.price))}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  Sản phẩm hiện chưa có kích cỡ đang bán.
                </p>
              )}
            </div>
          )}

          {/* Drinks specific options */}
          {isDrink && (
            <div className="space-y-5 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-semibold text-sm text-foreground">Chọn mức đường</label>
                  <select
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground"
                  >
                    {SUGAR_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-semibold text-sm text-foreground">Chọn mức đá</label>
                  <select
                    value={ice}
                    onChange={(e) => setIce(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground"
                  >
                    {ICE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {toppingOptions.length > 0 && <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Thêm Topping</h3>
                <div className="flex flex-wrap gap-2.5">
                  {toppingOptions.map((t: any) => {
                    const isSelected = selectedToppings.includes(t.name);
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => toggleTopping(t.name)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-full border transition ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        {isSelected ? <Check size={12} /> : null}
                        <span>{t.name} (+{formatPrice(Number(t.price || 0))})</span>
                      </button>
                    );
                  })}
                </div>
              </div>}
            </div>
          )}

          {/* Birthday Cake specific options */}
          {isBirthdayCake && (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="block font-semibold text-sm text-foreground">Lời chúc viết lên bánh</label>
                <textarea
                  placeholder="Ví dụ: Chúc mừng sinh nhật Vy!"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary text-foreground min-h-[70px] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="candles"
                  checked={needCandles}
                  onChange={(e) => setNeedCandles(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
                <label htmlFor="candles" className="text-sm text-muted-foreground select-none cursor-pointer">
                  Nhận kèm nến sinh nhật miễn phí
                </label>
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* Quantity and buying actions */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="size-11 border rounded-xl flex items-center justify-center hover:bg-secondary border-border text-foreground transition"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-bold text-base text-foreground">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="size-11 border rounded-xl flex items-center justify-center hover:bg-secondary border-border text-foreground transition"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-1 gap-3 min-w-[240px]">
              <Btn type="button" disabled={!selectedVariant} className="flex-1 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" onClick={() => handleAdd(false)}>
                Thêm vào giỏ
              </Btn>
              <Btn type="button" disabled={!selectedVariant} variant="secondary" className="flex-1 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" onClick={() => handleAdd(true)}>
                Mua ngay ({totalPriceStr})
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold font-serif mb-6 text-foreground border-b pb-3">Sản phẩm liên quan</h3>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {related.map((item: any) => (
              <ProductCard
                key={item[0]}
                p={item}
                onSelect={(prod: any) => { onSelectProduct(prod); }}
                isWishlisted={wishlist.some((w: any) => w[0] === item[0])}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
