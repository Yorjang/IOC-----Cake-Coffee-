import { useEffect, useState } from "react";
import { Clock, Coffee, AlertCircle, Truck } from "lucide-react";
import { heroBanners, categories, products } from "../../data/mockData";
import { ProductCard, Section } from "../components/shared";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { HOME_CONFIG, VIEW_KEYS } from "../../config/appConfig";

export function Home({ setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist }: any) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % heroBanners.length);
    }, HOME_CONFIG.HERO_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {/* ── Hero banner ── */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[430px] w-full md:h-[520px]">
          {heroBanners.map((banner, index) => (
            <img
              key={banner.src}
              src={banner.src}
              alt={banner.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${activeBanner === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/70 to-sidebar/20" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 mx-auto flex w-full max-w-[1500px] flex-col justify-center px-5 sm:px-6 lg:px-10">
          <p className="font-mono text-xs uppercase tracking-[.3em] text-primary-foreground/85 drop-shadow">{env.APP_NAME}</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight text-primary-foreground drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)] md:text-6xl whitespace-pre-line">
            {MESSAGES.HERO_TITLE}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/85 drop-shadow md:text-lg">
            {MESSAGES.HERO_SUBTITLE}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => setView(VIEW_KEYS.SWEETS)} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 shadow-lg">
              {MESSAGES.HERO_BUTTON_ORDER}
            </button>
            <button onClick={() => setView(VIEW_KEYS.DRINKS)} className="rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/20 backdrop-blur">
              {MESSAGES.HERO_BUTTON_EXPLORE}
            </button>
          </div>
          <div className="mt-6 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-primary-foreground/25 bg-sidebar/55 px-4 py-2 text-xs text-primary-foreground/90 shadow-lg backdrop-blur">
            <span className="size-2 rounded-full bg-green-400 animate-pulse" />
            {MESSAGES.FLASH_SALE_TEXT} <b className="text-primary ml-1">COFFEE20</b>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-10 flex w-full max-w-[1500px] -translate-x-1/2 gap-2 px-5 sm:px-6 lg:px-10">
          {heroBanners.map((banner, index) => (
            <button
              key={banner.alt}
              type="button"
              aria-label={`Chuyển sang banner ${index + 1}`}
              onClick={() => setActiveBanner(index)}
              className={`h-2.5 rounded-full transition-all ${activeBanner === index ? "w-8 bg-primary" : "w-2.5 bg-primary-foreground/60 hover:bg-primary-foreground"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Featured categories ── */}
      <Section title={MESSAGES.SECTION_CATEGORIES_TITLE} sub={MESSAGES.SECTION_CATEGORIES_SUB} messages={MESSAGES}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setView(c.name)}
              className="group rounded-2xl border bg-card overflow-hidden text-center transition hover:border-primary hover:shadow-md"
            >
              <div className="relative h-24 bg-muted">
                <img src={c.img} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
              <p className="p-2 text-xs font-semibold">{c.name}</p>
            </button>
          ))}
        </div>
      </Section>

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
          {products.slice(HOME_CONFIG.NEW_COMBOS_START, HOME_CONFIG.NEW_COMBOS_END).map(p => (
            <ProductCard key={p[0]} p={p} onSelect={onSelectProduct} isWishlisted={wishlist.some((w: any) => w[0] === p[0])} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} />
          ))}
        </div>
      </Section>

      {/* ── Why Sweet Bean ── */}
      <Section title={MESSAGES.SECTION_WHY_US_TITLE}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_CONFIG.FEATURE_ITEMS.map(f => {
            const Icon = { Clock, Coffee, AlertCircle, Truck }[f.icon];
            return (
              <div key={f.title} className="flex items-center gap-4 rounded-2xl bg-card p-5 border">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  {Icon && <Icon size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
