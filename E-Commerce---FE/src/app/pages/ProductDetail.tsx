import { useState } from "react";
import { Heart, Minus, Plus, Star, Check } from "lucide-react";
import { Btn, ProductCard } from "../components/shared";
import { CATEGORY_GROUPS, PRODUCT_DETAIL_CONFIG, VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";

// Price helper utilities
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
};

const formatPrice = (priceNum: number): string => {
  return priceNum.toLocaleString("vi-VN") + "đ";
};

const TOPPING_OPTIONS = [
  { name: "Trân châu trắng", price: 8000 },
  { name: "Thạch sương sáo", price: 5000 },
  { name: "Kem phô mai", price: 10000 },
];

const SUGAR_OPTIONS = ["100%", "70%", "50%", "30%"];
const ICE_OPTIONS = ["100%", "70%", "50%", "Không đá"];

export function ProductDetail({ product, setView, onAddToCart, wishlist, onToggleWishlist, onSelectProduct, products = [] }: any) {
  const p = product || products[0] || ["Sản phẩm", "0đ", "Khác", "", "5.0", ""];
  const isDrink = CATEGORY_GROUPS.DRINKS.includes(p[2] as any);
  const isBirthdayCake = p[2] === "Bánh sinh nhật";

  // Form states
  const [selectedSize, setSelectedSize] = useState("Vừa");
  const [sugar, setSugar] = useState("100%");
  const [ice, setIce] = useState("100%");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [needCandles, setNeedCandles] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isWishlisted = wishlist.some((w: any) => w[0] === p[0]);

  // Related products
  const related = products
    .filter(item => item[2] === p[2] && item[0] !== p[0])
    .slice(0, 4);

  // Price calculations
  const basePriceVal = parsePrice(p[1]);
  const sizeSurcharge = isDrink
    ? (selectedSize === "Nhỏ" ? -5000 : selectedSize === "Vừa" ? 0 : 10000)
    : (selectedSize === "Nhỏ" ? -20000 : selectedSize === "Vừa" ? 0 : 40000);

  const toppingsPrice = selectedToppings.reduce((sum, name) => {
    const option = TOPPING_OPTIONS.find(t => t.name === name);
    return sum + (option ? option.price : 0);
  }, 0);

  const unitPrice = Math.max(0, basePriceVal + sizeSurcharge + toppingsPrice);
  const totalPriceStr = formatPrice(unitPrice * quantity);

  const toggleTopping = (name: string) => {
    setSelectedToppings(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const handleAdd = (buyNow = false) => {
    const options = {
      sugar: isDrink ? sugar : undefined,
      ice: isDrink ? ice : undefined,
      toppings: isDrink && selectedToppings.length > 0 ? selectedToppings : undefined,
      customText: isBirthdayCake && customText.trim() ? customText : undefined,
      needCandles: isBirthdayCake && needCandles ? true : undefined,
    };
    onAddToCart(p, selectedSize, quantity, options, unitPrice);
    if (buyNow) {
      setView(VIEW_KEYS.CART);
    } else {
      toast.success(`Đã thêm ${quantity} x ${p[0]} vào giỏ hàng!`);
    }
  };

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
          <img src={p[3] as string} alt={p[0] as string} className="w-full h-full object-cover" />
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

            <p className="mt-4 text-3xl font-bold text-primary">{formatPrice(unitPrice)}</p>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Sản phẩm được chế biến từ những nguyên liệu chất lượng cao, được lựa chọn kỹ lưỡng mỗi ngày. Đảm bảo mang lại hương vị trọn vẹn và trải nghiệm ẩm thực tuyệt vời nhất cho quý khách.
            </p>
          </div>

          <hr className="border-border" />

          {/* Size selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Kích cỡ</h3>
            <div className="flex gap-3">
              {PRODUCT_DETAIL_CONFIG.SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${selectedSize === s ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

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

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Thêm Topping</h3>
                <div className="flex flex-wrap gap-2.5">
                  {TOPPING_OPTIONS.map(t => {
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
                        {isSelected && <Check size={12} />}
                        <span>{t.name} (+{formatPrice(t.price)})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
              <Btn type="button" className="flex-1 py-3 text-sm font-semibold" onClick={() => handleAdd(false)}>
                Thêm vào giỏ
              </Btn>
              <Btn type="button" variant="secondary" className="flex-1 py-3 text-sm font-semibold" onClick={() => handleAdd(true)}>
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
            {related.map(item => (
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

