import { useEffect, useState } from "react";
import { Truck, Gift, RefreshCw, Coffee, Clock, AlertCircle, MapPin, Copy, Check, Tag } from "lucide-react";
import { heroBanners } from "../../data/mockData";
import { ProductCard, Section } from "../components/shared";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { HOME_CONFIG, VIEW_KEYS } from "../../config/appConfig";

const VALUE_PROPS = [
  { icon: Truck, title: "Freeship nội thành", sub: "Đơn từ 200.000đ trong bán kính 8km" },
  { icon: Gift, title: "Tặng thiệp miễn phí", sub: "Áp dụng cho bánh sinh nhật đặt trước" },
  { icon: RefreshCw, title: "Đổi bánh trong ngày", sub: "Nếu giao sai mẫu hoặc hư hỏng khi nhận" },
  { icon: Coffee, title: "Combo cafe + bánh", sub: "Giảm thêm khi mua kèm đồ uống" },
];

const VOUCHERS = [
  { code: "CAKE10", title: "Giảm 10% bánh ngọt", sub: "Không yêu cầu đơn tối thiểu" },
  { code: "COFFEE20", title: "Giảm 20% cafe", sub: "Khi mua kèm bánh bất kỳ" },
  { code: "NEWUSER50", title: "Giảm 50.000đ", sub: "Cho khách hàng mới" },
];

const STORES = [
  { name: "Sweet Bean Quận 1", addr: "123 Nguyễn Huệ, Q.1", hours: "07:00 – 22:00" },
  { name: "Sweet Bean Quận 3", addr: "45 Võ Văn Tần, Q.3", hours: "07:00 – 21:30" },
  { name: "Sweet Bean Bình Thạnh", addr: "88 Xô Viết Nghệ Tĩnh, BT", hours: "08:00 – 21:00" },
];

function VoucherRow({ code, title, sub }: any) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
      <div>
        <p className="text-xs font-bold tracking-widest text-primary/80 uppercase">{code}</p>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button type="button" onClick={copy} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary shrink-0">
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        {copied ? "Đã lưu" : "Lưu mã"}
      </button>
    </div>
  );
}

export function Home({ setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist, products = [], categories = [] }: any) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [storeSearch, setStoreSearch] = useState("");
  const filteredStores = STORES.filter(s =>
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.addr.toLowerCase().includes(storeSearch.toLowerCase())
  );

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
            <img key={banner.src} src={banner.src} alt={banner.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${activeBanner === index ? "opacity-100" : "opacity-0"}`} />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/70 to-sidebar/20" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex w-full flex-col justify-center px-2 sm:px-4 lg:px-4">
          <p className="font-mono text-xs uppercase tracking-[.3em] text-primary-foreground/85 drop-shadow">{env.APP_NAME}</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight text-primary-foreground drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)] md:text-6xl whitespace-pre-line">{MESSAGES.HERO_TITLE}</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/85 drop-shadow md:text-lg">{MESSAGES.HERO_SUBTITLE}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => setView(VIEW_KEYS.SWEETS)} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 shadow-lg">{MESSAGES.HERO_BUTTON_ORDER}</button>
            <button onClick={() => setView(VIEW_KEYS.DRINKS)} className="rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/20 backdrop-blur">{MESSAGES.HERO_BUTTON_EXPLORE}</button>
          </div>
          <div className="mt-6 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-primary-foreground/25 bg-sidebar/55 px-4 py-2 text-xs text-primary-foreground/90 shadow-lg backdrop-blur">
            <span className="size-2 rounded-full bg-green-400 animate-pulse" />
            {MESSAGES.FLASH_SALE_TEXT} <b className="text-primary ml-1">COFFEE20</b>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-2 sm:px-4 lg:px-4">
          {heroBanners.map((banner, index) => (
            <button key={banner.alt} type="button" aria-label={`Chuyển sang banner ${index + 1}`} onClick={() => setActiveBanner(index)}
              className={`h-2.5 rounded-full transition-all ${activeBanner === index ? "w-8 bg-primary" : "w-2.5 bg-primary-foreground/60 hover:bg-primary-foreground"}`} />
          ))}
        </div>
      </section>

      {/* ── Value propositions strip ── */}
      <div className="border-b bg-background">
        <div className="w-full grid grid-cols-2 gap-px px-2 sm:px-4 lg:grid-cols-4 lg:px-4">
          {VALUE_PROPS.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3 py-5 px-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon size={20} /></span>
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
            </div>
          ))}
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
            <img src={products[4]?.[3] || products[0]?.[3] || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1800&h=650&fit=crop&auto=format"} alt="Flash deal" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground"><Tag size={12} />Flash deal đến 16:00</span>
              <h3 className="text-2xl font-bold text-white md:text-3xl">Combo Tiramisu + Latte</h3>
              <p className="mt-1 text-sm text-white/75">Gợi ý mua kèm đang bán tốt nhất hôm nay, phù hợp cho khách văn phòng và đơn giao nhanh.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-primary">89.000đ</span>
                <span className="text-sm text-white/60 line-through">109.000đ</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">Tiết kiệm 20.000đ</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setView(VIEW_KEYS.COMBO)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition">Xem combo</button>
                <button onClick={() => {
                  const dealProduct = products[4] || products[0];
                  if (dealProduct) onAddToCart?.(dealProduct);
                }} className="rounded-full border border-white/50 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition">Thêm vào giỏ</button>
              </div>
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
                {VOUCHERS.map(v => <VoucherRow key={v.code} {...v} />)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["1.200+", "Đơn hàng / tháng"], ["4.9/5", "Đánh giá TB"], ["35 phút", "Giao hàng TB"]].map(([val, label]) => (
                <div key={label} className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-xl font-bold text-primary">{val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">{Icon && <Icon size={24} />}</div>
                <div><h3 className="font-bold text-sm sm:text-base">{f.title}</h3><p className="text-xs sm:text-sm text-muted-foreground">{f.sub}</p></div>
              </div>
            );
          })}
        </div>
      </Section>


    </>
  );
}
