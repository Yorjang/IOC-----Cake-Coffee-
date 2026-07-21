import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Truck, Gift, RefreshCw, Coffee, Clock, AlertCircle, Check, Tag } from "lucide-react";
const heroBanners = [
  { src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1800&h=650&fit=crop&auto=format", alt: "Sweet Bean coffee and cakes" },
  { src: "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1800&h=650&fit=crop&auto=format", alt: "Fresh baked cookies and pastries" },
  { src: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1800&h=650&fit=crop&auto=format", alt: "Dessert combo with coffee" }
];
import { ProductCard, Section } from "../components/shared";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { HOME_CONFIG, VIEW_KEYS } from "../../config/appConfig";

function VoucherDetailModal({ voucher, products, onSelectProduct, setView, onClose }: any) {
  if (!voucher) return null;
  const d = voucher.rawData;
  const scopeProduct = d?.product;
  const scopeCategory = d?.category;
  const scopeLabel = d?.productId && scopeProduct
    ? 'Sản phẩm'
    : d?.categoriesId && scopeCategory
    ? 'Danh mục'
    : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ animation: 'fadeIn .2s ease' }}>
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp .25s ease' }}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Header */}
        <div className="text-center mb-5 mt-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Tag size={28} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold font-serif">{voucher.sub}</h3>
          <p className="text-sm text-primary font-mono tracking-widest mt-2 bg-primary/10 inline-block px-4 py-1.5 rounded-full uppercase font-bold">{voucher.code}</p>
        </div>

        {/* Description */}
        {voucher.title && voucher.title !== voucher.sub && (
          <div className="bg-secondary/50 p-3 rounded-xl text-center text-foreground font-medium text-sm mb-4">
            {voucher.title}
          </div>
        )}

        {/* Detail grid */}
        {d && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[110px_1fr] gap-y-2.5 gap-x-3 bg-secondary/30 rounded-xl p-4">
              <span className="text-muted-foreground font-medium">Giảm giá:</span>
              <span className="text-foreground font-semibold">
                {d.discountType === 'percent'
                  ? `${Number(d.discountValue)}%${d.maxDiscount ? ` (tối đa ${Number(d.maxDiscount).toLocaleString()}đ)` : ''}`
                  : `${Number(d.discountValue).toLocaleString()}đ`}
              </span>

              <span className="text-muted-foreground font-medium">Đơn tối thiểu:</span>
              <span className="text-foreground font-semibold">
                {d.minOrderValue > 0 ? `${Number(d.minOrderValue).toLocaleString()}đ` : 'Không yêu cầu'}
              </span>

              {(d.startsAt || d.expiresAt) && (
                <>
                  <span className="text-muted-foreground font-medium">Hạn dùng:</span>
                  <span className="text-foreground">
                    {d.startsAt ? new Date(d.startsAt).toLocaleDateString('vi-VN') : 'Nay'}
                    {' — '}
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                  </span>
                </>
              )}

              <span className="text-muted-foreground font-medium">Phạm vi:</span>
              <span className="text-foreground font-semibold">
                {scopeLabel ? scopeLabel : 'Toàn bộ đơn hàng'}
              </span>
            </div>

            {/* Applied product card */}
            {d.productId && scopeProduct && (
              <div className="border rounded-xl p-3 flex items-center gap-3">
                {scopeProduct.imageUrl && (
                  <img src={scopeProduct.imageUrl} alt={scopeProduct.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Áp dụng cho sản phẩm</p>
                  <p className="font-bold text-foreground truncate">{scopeProduct.name}</p>
                  {scopeProduct.category?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">Danh mục: {scopeProduct.category.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Applied category card */}
            {d.categoriesId && scopeCategory && !d.productId && (
              <div className="border rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift size={22} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Áp dụng cho danh mục</p>
                  <p className="font-bold text-foreground">{scopeCategory.name}</p>
                </div>
              </div>
            )}

            {/* All orders */}
            {!d.productId && !d.categoriesId && (
              <div className="border rounded-xl p-3 flex items-center gap-3 border-dashed">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Check size={22} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-0.5">Không giới hạn</p>
                  <p className="font-bold text-foreground">Áp dụng cho tất cả sản phẩm</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          <button
            onClick={() => {
              navigator.clipboard.writeText(voucher.code);
              if (d?.productId) {
                const p = products.find((p: any) => p[0] === d.productId || p.raw?.id === d.productId);
                if (p) {
                  onSelectProduct?.(p);
                } else {
                  setView?.(VIEW_KEYS.SWEETS);
                }
              } else if (d?.categoriesId && scopeCategory) {
                setView?.(scopeCategory.name);
              } else {
                // Global voucher: applies to everything except combos (combos already have their own discount)
                setView?.(VIEW_KEYS.ALL_PRODUCTS);
              }
              onClose();
            }}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition"
          >
            Đặt hàng ngay
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function VoucherRow({ code, title, sub, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 cursor-pointer hover:border-primary/50 transition">
      <div>
        <p className="text-xs font-bold tracking-widest text-primary/80 uppercase">{code}</p>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export function Home({ setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist, products = [], categories = [], publicCoupons = [] }: any) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState<Array<{ src: string; alt: string; title?: string; subtitle?: string; linkUrl?: string }>>(heroBanners);
  const [storeSearch, setStoreSearch] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const taggedSections = Array.from(
    products.reduce((sections: Map<string, { tag: any; products: any[] }>, product: any) => {
      for (const tag of product.raw?.tags || []) {
        const section = sections.get(tag.id) || { tag, products: [] };
        section.products.push(product);
        sections.set(tag.id, section);
      }
      return sections;
    }, new Map()).values(),
  ) as Array<{ tag: any; products: any[] }>;

  const displayVouchers = publicCoupons.slice(0, 3).map((c: any) => ({
    code: c.code,
    title: c.description || (c.minOrderValue > 0 ? `Đơn từ ${Number(c.minOrderValue).toLocaleString()}đ` : 'Không yêu cầu đơn tối thiểu'),
    sub: c.name || `Giảm ${c.discountType === 'percent' ? Number(c.discountValue) + '%' : Number(c.discountValue).toLocaleString() + 'đ'}`,
    rawData: c
  }));

  const dealItems = useMemo(() => {
    const combos = products.filter((p: any) => p.raw?.productType === "combo");
    const discounted = products.filter((p: any) => p[6] && p.raw?.productType !== "combo");
    return [...combos, ...discounted]
      .sort((a: any, b: any) => new Date(b.raw?.createdAt || 0).getTime() - new Date(a.raw?.createdAt || 0).getTime())
      .slice(0, HOME_CONFIG.DEAL_ITEMS_LIMIT);
  }, [products]);

  const [activeDeal, setActiveDeal] = useState(0);
  useEffect(() => {
    if (dealItems.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveDeal((current) => (current + 1) % dealItems.length);
    }, HOME_CONFIG.DEAL_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [dealItems.length]);
  const currentDeal = dealItems[Math.min(activeDeal, dealItems.length - 1)];
  const fallbackDeal = products[4] || products[0];
  const dealIsCombo = currentDeal?.raw?.productType === "combo";
  const dealSavings = currentDeal?.[6]
    ? Number(String(currentDeal[1]).replace(/\D/g, "")) - Number(String(currentDeal[6]).replace(/\D/g, ""))
    : 0;

  useEffect(() => { let cancelled = false; fetch(`${env.API_URL}/banners/public`).then(response => response.ok ? response.json() : Promise.reject(response.status)).then(data => { const next = Array.isArray(data) ? data.filter((banner: any) => banner.imageUrl).map((banner: any) => ({ src: banner.imageUrl, alt: banner.title || "Sweet Bean promotion", title: banner.title, subtitle: banner.subtitle, linkUrl: banner.linkUrl })) : []; if (!cancelled && next.length) { setBanners(next); setActiveBanner(0); } }).catch(() => {}); return () => { cancelled = true; }; }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, HOME_CONFIG.HERO_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeBanner];
  return (
    <>
      {/* ── Hero banner ── */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[430px] w-full md:h-[520px]">
          {banners.map((banner, index) => (
            <img key={banner.src} src={banner.src} alt={banner.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${activeBanner === index ? "opacity-100" : "opacity-0"}`} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/70 to-sidebar/20" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex w-full flex-col justify-center px-2 sm:px-4 lg:px-4">
          <p className="font-mono text-xs uppercase tracking-[.3em] text-primary-foreground/85 drop-shadow">{env.APP_NAME}</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight text-primary-foreground drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)] md:text-6xl whitespace-pre-line">{currentBanner?.title || MESSAGES.HERO_TITLE}</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/85 drop-shadow md:text-lg">{currentBanner?.subtitle || MESSAGES.HERO_SUBTITLE}</p>
          <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => setView(VIEW_KEYS.SWEETS)} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 shadow-lg">{MESSAGES.HERO_BUTTON_ORDER}</button>
            {currentBanner?.linkUrl ? (
              <a href={currentBanner.linkUrl} className="rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/20 backdrop-blur">{"Tham gia ch\u01B0\u01A1ng tr\u00ECnh"}</a>
            ) : (
              <button onClick={() => setView(VIEW_KEYS.DRINKS)} className="rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/20 backdrop-blur">{MESSAGES.HERO_BUTTON_EXPLORE}</button>
            )}
          </div>
          <div className="mt-6 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-primary-foreground/25 bg-sidebar/55 px-4 py-2 text-xs text-primary-foreground/90 shadow-lg backdrop-blur">
            <span className="size-2 rounded-full bg-green-400 animate-pulse" />
            {MESSAGES.FLASH_SALE_TEXT} <b className="text-primary ml-1">NEWBIE</b>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-2 sm:px-4 lg:px-4">
          {banners.map((banner, index) => (
            <button key={banner.alt} type="button" aria-label={`Chuyển sang banner ${index + 1}`} onClick={() => setActiveBanner(index)}
              className={`h-2.5 rounded-full transition-all ${activeBanner === index ? "w-8 bg-primary" : "w-2.5 bg-primary-foreground/60 hover:bg-primary-foreground"}`} />
          ))}
        </div>
      </section>

      {/* ── Value propositions strip ── */}
      <div className="border-b bg-background">
        <div className="w-full grid grid-cols-2 gap-px px-2 sm:px-4 lg:grid-cols-4 lg:px-4">
          <div className="flex items-center gap-3 py-5 px-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Truck size={20} /></span>
            <div><p className="text-sm font-semibold">Freeship nội thành</p><p className="text-xs text-muted-foreground">Đơn từ 200.000đ trong bán kính 3km</p></div>
          </div>
          <div className="flex items-center gap-3 py-5 px-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Gift size={20} /></span>
            <div><p className="text-sm font-semibold">Tặng thiệp miễn phí</p><p className="text-xs text-muted-foreground">Áp dụng cho bánh sinh nhật đặt trước</p></div>
          </div>
          <div className="flex items-center gap-3 py-5 px-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><RefreshCw size={20} /></span>
            <div><p className="text-sm font-semibold">Đổi bánh trong ngày</p><p className="text-xs text-muted-foreground">Nếu giao sai mẫu hoặc hư hỏng khi nhận</p></div>
          </div>
          <div className="flex items-center gap-3 py-5 px-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Coffee size={20} /></span>
            <div><p className="text-sm font-semibold">Combo cafe + bánh</p><p className="text-xs text-muted-foreground">Giảm thêm khi mua kèm đồ uống</p></div>
          </div>
        </div>
      </div>

      {/* ── Featured categories ── */}
      <Section title={MESSAGES.SECTION_CATEGORIES_TITLE} sub={MESSAGES.SECTION_CATEGORIES_SUB} messages={MESSAGES}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <button key={c.name} onClick={() => setView(c.name)} className="group rounded-2xl border bg-card overflow-hidden text-center transition hover:border-primary hover:shadow-md">
              <div className="relative h-24 bg-muted">
                <img src={c.img} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
              <p className="p-2 text-xs font-semibold">{c.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Deal ngọt + Vouchers ── */}
      <section className="w-full px-2 sm:px-4 lg:px-4 py-9">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">{env.APP_NAME}</p>
            <h2 className="mt-1 text-3xl md:text-4xl">Deal ngọt hôm nay</h2>
            <p className="mt-2 text-muted-foreground">Giá ưu đãi có thời hạn, phù hợp để tăng đơn nhanh và gợi ý mua kèm</p>
          </div>
          <button onClick={() => setView(VIEW_KEYS.COMBO)} className="shrink-0 rounded-full bg-secondary px-5 py-2.5 text-sm font-medium transition hover:bg-secondary/80">Xem tất cả</button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Flash deal card */}
          <div className="relative overflow-hidden rounded-2xl h-80 lg:h-auto">
            {dealItems.length > 0 ? (
              dealItems.map((item: any, index: number) => (
                <img key={item.raw?.id || item[0]} src={item[3]} alt={item[0]}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${activeDeal === index ? "opacity-100" : "opacity-0"}`} />
              ))
            ) : (
              <img src={fallbackDeal?.[3] || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1800&h=650&fit=crop&auto=format"} alt="Ưu đãi hôm nay" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              {currentDeal ? (
                <>
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground"><Tag size={12} />{dealIsCombo ? "Combo tiết kiệm" : "Giảm giá hôm nay"}</span>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{currentDeal[0]}</h3>
                  <p className="mt-1 text-sm text-white/75">{dealIsCombo ? "Gợi ý mua kèm đang bán tốt nhất hôm nay, phù hợp cho khách văn phòng và đơn giao nhanh." : "Sản phẩm mới, đang có giá ưu đãi trong thời gian có hạn."}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {currentDeal[6] ? (
                      <>
                        <span className="text-2xl font-bold text-primary">{currentDeal[6]}</span>
                        <span className="text-sm text-white/60 line-through">{currentDeal[1]}</span>
                        {dealSavings > 0 && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">Tiết kiệm {dealSavings.toLocaleString("vi-VN")}đ</span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary">{currentDeal[1]}</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {dealIsCombo ? (
                      <button onClick={() => setView(VIEW_KEYS.COMBO)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition">Xem combo</button>
                    ) : (
                      <button onClick={() => onSelectProduct?.(currentDeal)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition">Xem sản phẩm</button>
                    )}
                    <button onClick={() => onAddToCart?.(currentDeal)} className="rounded-full border border-white/50 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition">Thêm vào giỏ</button>
                  </div>
                  {dealItems.length > 1 && (
                    <div className="mt-4 flex gap-2">
                      {dealItems.map((item: any, index: number) => (
                        <button key={item.raw?.id || item[0]} type="button" aria-label={`Chuyển sang ưu đãi ${index + 1}`} onClick={() => setActiveDeal(index)}
                          className={`h-2 rounded-full transition-all ${activeDeal === index ? "w-6 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">Ưu đãi hôm nay</h3>
                  <p className="mt-1 text-sm text-white/75">Đang cập nhật ưu đãi, quay lại sau nhé.</p>
                </>
              )}
            </div>
          </div>

          {/* Vouchers panel */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">VOUCHER ĐANG CHẠY</p>
                  <h3 className="text-lg font-bold">Mã giảm giá dễ dùng</h3>
                </div>
                <Tag size={18} className="text-primary" />
              </div>
              <div className="space-y-3">
                {displayVouchers.map((v: any) => <VoucherRow key={v.code} {...v} onClick={() => setSelectedVoucher(v)} />)}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {taggedSections.map(({ tag, products: taggedProducts }) => (
        <Section key={tag.id} title={tag.name}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {taggedProducts.slice(0, HOME_CONFIG.BEST_SELLERS_LIMIT).map(product => (
              <ProductCard key={product.raw?.id || product[0]} p={product} onSelect={onSelectProduct} isWishlisted={wishlist.some((item: any) => item[0] === product[0])} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} />
            ))}
          </div>
        </Section>
      ))}

      {/* ── Best sellers ── */}
      <Section title={MESSAGES.SECTION_BESTSELLERS_TITLE} sub={MESSAGES.SECTION_BESTSELLERS_SUB} onViewAll={() => setView(VIEW_KEYS.SWEETS)}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, HOME_CONFIG.BEST_SELLERS_LIMIT).map(p => (
            <ProductCard key={p[0]} p={p} onSelect={onSelectProduct} isWishlisted={wishlist.some((w: any) => w[0] === p[0])} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} />
          ))}
        </div>
      </Section>

      {/* ── New + combos ── */}
      <Section title={MESSAGES.SECTION_NEW_COMBOS_TITLE} onViewAll={() => setView(VIEW_KEYS.COMBO)}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.filter((p: any) => p[2] === "Combo").slice(0, HOME_CONFIG.NEW_COMBOS_LIMIT).map((p: any) => (
            <ProductCard key={p[0]} p={p} onSelect={onSelectProduct} isWishlisted={wishlist.some((w: any) => w[0] === p[0])} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} />
          ))}
        </div>
      </Section>

      {/* ── Why Sweet Bean ── */}
      <Section title={MESSAGES.SECTION_WHY_US_TITLE}>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
          {HOME_CONFIG.FEATURE_ITEMS.map(f => {
            const Icon = { Clock, Coffee, AlertCircle, Truck }[f.icon];
            return (
              <div key={f.title} className="flex items-center gap-4 rounded-2xl bg-card p-5 border min-w-[240px] flex-1 snap-start">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">{Icon && <Icon size={24} />}</div>
                <div><h3 className="font-bold text-sm sm:text-base line-clamp-1">{f.title}</h3><p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{f.sub}</p></div>
              </div>
            );
          })}
        </div>
      </Section>



      <VoucherDetailModal
        voucher={selectedVoucher}
        products={products}
        onSelectProduct={onSelectProduct}
        setView={setView}
        onClose={() => setSelectedVoucher(null)}
      />
    </>
  );
}
