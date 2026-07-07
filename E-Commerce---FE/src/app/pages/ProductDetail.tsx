import { useState } from "react";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { products } from "../../data/mockData";
import { Btn, ProductCard } from "../components/shared";
import { PRODUCT_DETAIL_CONFIG, VIEW_KEYS } from "../../config/appConfig";
import { toast } from "sonner";

export function ProductDetail({ product, setView, onAddToCart, wishlist, onToggleWishlist, onSelectProduct }: any) {
  const p = product || products[0];
  const [selectedSize, setSelectedSize] = useState("Vừa");
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = wishlist.some((w: any) => w[0] === p[0]);

  const related = products
    .filter(item => item[2] === p[2] && item[0] !== p[0])
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setView(VIEW_KEYS.HOME)} className="hover:text-primary">Trang chủ</button>
        <span>/</span>
        <button onClick={() => setView(p[2])} className="hover:text-primary">{p[2]}</button>
        <span>/</span>
        <span className="text-foreground font-semibold">{p[0]}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl border bg-muted relative aspect-square max-h-[500px]">
          <img src={p[3] as string} alt={p[0] as string} className="w-full h-full object-cover" />
          <button
            onClick={() => onToggleWishlist(p)}
            className={`absolute right-4 top-4 rounded-full p-3 transition shadow-md ${isWishlisted ? "bg-rose-100 text-rose-500" : "bg-card/95 hover:bg-accent"}`}
          >
            <Heart size={20} className={isWishlisted ? "fill-rose-500" : ""} />
          </button>
        </div>
        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{p[2]}</span>
          <h1 className="mt-4 text-3xl md:text-4xl font-serif font-bold">{p[0]}</h1>

          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center text-amber-500 text-sm font-semibold gap-1">
              <Star size={16} className="fill-amber-500 text-amber-500" /> {p[4]}
            </span>
            <span className="text-muted-foreground text-sm">|</span>
            <button onClick={() => setView(VIEW_KEYS.REVIEW)} className="text-primary hover:underline text-sm font-semibold">
              Xem đánh giá của khách hàng
            </button>
          </div>

          <p className="mt-4 text-2xl font-bold text-primary">{p[1]}</p>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Sản phẩm được chế biến từ những nguyên liệu chất lượng cao, được lựa chọn kỹ lưỡng mỗi ngày. Đảm bảo mang lại hương vị trọn vẹn và trải nghiệm ẩm thực tuyệt vời nhất cho quý khách.
          </p>

          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm">Chọn kích cỡ</h3>
            <div className="flex gap-3">
              {PRODUCT_DETAIL_CONFIG.SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`rounded-xl border px-5 py-2 text-sm font-medium transition ${selectedSize === s ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm">Số lượng</h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="size-10 border rounded-xl flex items-center justify-center hover:bg-secondary transition">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="size-10 border rounded-xl flex items-center justify-center hover:bg-secondary transition">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Btn className="flex-1" onClick={() => { onAddToCart(p, selectedSize, quantity); toast.success("Đã thêm vào giỏ hàng!"); }}>Thêm vào giỏ</Btn>
            <Btn variant="secondary" className="flex-1" onClick={() => { onAddToCart(p, selectedSize, quantity); setView(VIEW_KEYS.CART); }}>Mua ngay</Btn>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold font-serif mb-6">Sản phẩm liên quan</h3>
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
