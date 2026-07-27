import { Heart, Star, Plus } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";

export function Btn({ children, variant = "primary", disabled = false, onClick, small = false }: any) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary/80"
    : variant === "ghost"
    ? "bg-transparent hover:bg-secondary text-foreground"
    : "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} transition shadow-sm focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${cls}`}
    >
      {children}
    </button>
  );
}
export function getDiscountedPrice(originalPrice: number, productOrId: any, coupons: any[], size?: string) {
  if (!originalPrice || originalPrice <= 0 || !Array.isArray(coupons)) {
    return { discountedPrice: originalPrice, discountAmount: 0, bestCoupon: null };
  }
  let maxDiscount = 0;
  let bestCoupon = null;


  const product = typeof productOrId === 'object' ? productOrId : null;
  const productId = product ? product.id : productOrId;
  const productCategoryId = product ? (product.categoryId || product.category?.id) : null;

  coupons.forEach(c => {
    const isProductMatch = !c.productId || c.productId === productId;
    const isCategoryMatch = !c.categoriesId || (productCategoryId && c.categoriesId === productCategoryId);
    const isSizeMatch = !c.targetSize || (size && (
      size.toLowerCase().trim() === c.targetSize.toLowerCase().trim() ||
      size.toLowerCase().trim().startsWith(c.targetSize.toLowerCase().trim())
    ));
    if (isProductMatch && isCategoryMatch && isSizeMatch) {
      let discount = 0;
      if (c.discountType === 'percent') {
        discount = originalPrice * (Number(c.discountValue) / 100);
      } else if (c.discountType === 'fixed') {
        discount = Number(c.discountValue);
      }
      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestCoupon = c;
      }
    }
  });
  const finalDiscount = Math.round(maxDiscount);
  return {
    discountedPrice: Math.max(0, originalPrice - finalDiscount),
    discountAmount: finalDiscount,
    bestCoupon
  };
}
function getTagColor(tag: string) {
  if (!tag) return 'bg-[#895742]';
  const t = tag.toLowerCase();
  if (t.includes('best')) return 'bg-[#895742]';
  if (t.includes('season')) return 'bg-[#c19a6b]';
  if (t.includes('sign')) return 'bg-black';
  if (t.includes('hot')) return 'bg-[#e65c00]';
  if (t.includes('gift')) return 'bg-[#e91e63]';
  return 'bg-[#895742]';
}

export function ProductCard({ p, onSelect, isWishlisted, onToggleWishlist, onAddToCart, compact }: any) {
  return (
    <article
      onClick={() => onSelect?.(p)}
      className="group cursor-pointer flex flex-col transition"
    >
      <div className="relative aspect-square w-full bg-muted mb-4 overflow-hidden shadow-sm">
        <img src={p[3]} alt={p[0]} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        {p[5] && (
          <span className={`absolute left-0 top-3 ${getTagColor(p[5])} px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase`}>
            {p[5]}
          </span>
        )}
      </div>
      <div className="flex flex-col px-1">
        <h3 className="text-lg md:text-[22px] text-[#2d1a13] leading-snug mb-1" style={{ fontFamily: "'Bodoni Moda', serif" }}>{p[0]}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            {p[6] ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[14px] font-bold text-[#2d1a13]">{p[6]}</span>
                <span className="text-[12px] text-muted-foreground line-through">{p[1]}</span>
              </div>
            ) : (
              <span className="text-[14px] font-bold text-[#2d1a13]">{p[1]}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#a78b71]">
              <Star className="fill-[#a78b71] text-[#a78b71]" size={12} />
              {p[4]}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onAddToCart?.(p); }}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[#6f3f26] text-white hover:bg-[#b99368] transition"
              title="Thêm vào giỏ hàng"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HorizontalProductCard({ p, onSelect, onAddToCart }: any) {
  return (
    <article
      onClick={() => onSelect?.(p)}
      className="group cursor-pointer flex w-[320px] md:w-[380px] h-[140px] md:h-[160px] bg-white rounded-2xl overflow-hidden shrink-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] shadow-sm border border-black/5"
    >
      <div className="w-[45%] h-full relative overflow-hidden bg-muted">
        <img src={p[3]} alt={p[0]} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="w-[55%] flex flex-col justify-center px-4 md:px-5 py-3">
        <h3 className="text-[14px] md:text-[16px] text-[#3d2314] uppercase leading-snug mb-2 line-clamp-2" style={{ fontFamily: "'Bodoni Moda', serif", fontWeight: 700 }}>
          {p[0]}
        </h3>
        <span className="text-[13px] md:text-[14px] text-[#3d2314] font-medium mb-4">{p[1]}</span>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onAddToCart?.(p); }}
          className="text-[#6f3f26] text-[11px] md:text-[12px] uppercase font-bold flex items-center gap-1.5 hover:text-[#b99368] transition-colors w-fit"
        >
          Đặt ngay <span className="text-lg leading-none">&rarr;</span>
        </button>
      </div>
    </article>
  );
}


export function Section({ title, children, sub, onViewAll, preTitle, showArrows }: any) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-[12px] uppercase tracking-[.25em] text-[#b99368] mb-2 font-semibold">{preTitle || env.APP_NAME}</p>
          <h2 className="text-3xl md:text-[42px] text-[#2d1a13] leading-none" style={{ fontFamily: "'Bodoni Moda', serif" }}>
            {title}
          </h2>
          {sub && <p className="mt-3 text-sm text-[#2d1a13]/80">{sub}</p>}
        </div>
        {showArrows ? (
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-10 h-10 border border-[#e5e5e5] text-[#2d1a13] bg-white transition hover:bg-gray-50">
              <span className="text-lg">&lsaquo;</span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 border border-[#e5e5e5] text-[#2d1a13] bg-white transition hover:bg-gray-50">
              <span className="text-lg">&rsaquo;</span>
            </button>
          </div>
        ) : (
          onViewAll && (
            <button onClick={onViewAll} className="shrink-0 rounded-full bg-[#f4dcc6] text-[#2d1a13] px-6 py-2.5 text-[13px] font-semibold transition hover:bg-[#e6cbb4]">
              {MESSAGES.BUTTON_VIEW_ALL}
            </button>
          )
        )}
      </div>
      {children}
    </section>
  );
}
