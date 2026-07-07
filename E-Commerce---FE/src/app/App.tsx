import { useEffect, useState } from "react";
import { Coffee, PackageCheck, AlertCircle, Clock, Truck, CreditCard } from "lucide-react";
import { AdminPanel } from "./components/AdminPanel";
import { AuthPage } from "./components/AuthPage";
import { ReviewPage } from "./components/ReviewPage";

// ── Data & Components ──────────────────────────────────────────────────────────
import { categories, products, navPages, heroBanners } from "../data/mockData";
import { Btn, ProductCard, Section } from "./components/shared";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MESSAGES } from "../constants/messages";
import { env } from "../config/env";
import {
  CART_CONFIG,
  CATEGORY_GROUPS,
  CHECKOUT_CONFIG,
  HOME_CONFIG,
  PRODUCT_DETAIL_CONFIG,
  VIEW_KEYS,
} from "../config/appConfig";

// ── Pages ─────────────────────────────────────────────────────────────────────
function Home({ setView }: any) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % heroBanners.length);
    }, HOME_CONFIG.HERO_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {/* ── Single full-width hero banner ── */}
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
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/70 to-sidebar/20" />
        <div className="absolute inset-0 bg-black/20" />
        {/* Content */}
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
          {/* Flash sale badge */}
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
              onClick={() => setView(CATEGORY_GROUPS.DRINKS.includes(c.name as any) ? VIEW_KEYS.DRINKS : c.name === VIEW_KEYS.COMBO ? VIEW_KEYS.COMBO : VIEW_KEYS.SWEETS)}
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
      <Section title={MESSAGES.SECTION_BESTSELLERS_TITLE} sub={MESSAGES.SECTION_BESTSELLERS_SUB} messages={MESSAGES}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, HOME_CONFIG.BEST_SELLERS_LIMIT).map(p => <ProductCard key={p[0]} p={p} setView={setView} />)}
        </div>
      </Section>

      {/* ── New + combos ── */}
      <Section title={MESSAGES.SECTION_NEW_COMBOS_TITLE} messages={MESSAGES}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(HOME_CONFIG.NEW_COMBOS_START, HOME_CONFIG.NEW_COMBOS_END).map(p => <ProductCard key={p[0]} p={p} setView={setView} />)}
        </div>
      </Section>

      {/* ── Why Sweet Bean ── */}
      <Section title={MESSAGES.SECTION_WHY_US_TITLE} messages={MESSAGES}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_CONFIG.FEATURE_ITEMS.map(f => {
            const Icon = { Clock, Coffee, AlertCircle, Truck }[f.icon];
            return (
              <div key={f.title} className="flex items-center gap-4 rounded-2xl bg-card p-5 border">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><Icon size={24} /></div>
                <div><h3 className="font-bold">{f.title}</h3><p className="text-sm text-muted-foreground">{f.sub}</p></div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function ProductListing({ category, setView }: any) {
  const filtered = category === VIEW_KEYS.DRINKS
    ? products.filter(p => CATEGORY_GROUPS.DRINKS.includes(p[2] as any))
    : products.filter(p => p[2] === category);
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl">{category}</h2>
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(p => <ProductCard key={p[0]} p={p} setView={setView} />)}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">Không tìm thấy sản phẩm.</div>
      )}
    </div>
  );
}

function ProductDetail({ setView }: any) {
  const p = products[PRODUCT_DETAIL_CONFIG.DEFAULT_PRODUCT_INDEX];
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl border bg-muted">
          <img src={p[3] as string} alt={p[0] as string} className="w-full object-cover" />
        </div>
        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{p[2]}</span>
          <h1 className="mt-4 text-3xl md:text-4xl">{p[0]}</h1>
          <p className="mt-4 text-2xl font-bold text-primary">{p[1]}</p>
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Chọn kích cỡ</h3>
            <div className="flex gap-3">
              {PRODUCT_DETAIL_CONFIG.SIZE_OPTIONS.map((s, i) => (
                <button key={s} className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${i === PRODUCT_DETAIL_CONFIG.DEFAULT_SIZE_INDEX ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/50"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <Btn onClick={() => setView(VIEW_KEYS.CART)}>Thêm vào giỏ</Btn>
            <Btn variant="secondary">Mua ngay</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cart({ setView }: any) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl">Giỏ hàng của bạn</h2>
      <div className="space-y-4">
        {CART_CONFIG.SAMPLE_PRODUCT_INDEXES.map(i => {
          const p = products[i];
          return (
            <div key={i} className="flex gap-4 rounded-2xl border bg-card p-4">
              <img src={p[3] as string} alt="" className="size-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{p[0]}</h3>
                  <p className="text-primary">{p[1]}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">SL: {CART_CONFIG.ITEM_QUANTITY}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <Btn onClick={() => setView(VIEW_KEYS.CHECKOUT)}>Tiến hành thanh toán</Btn>
      </div>
    </div>
  );
}

function Checkout({ setView }: any) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl">Thanh toán</h2>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2"><Truck size={18} /> Giao hàng</h3>
            {CHECKOUT_CONFIG.SHIPPING_FIELDS.slice(0, 2).map((field) => (
              <input key={field} type="text" placeholder={field} className="mb-3 w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary" />
            ))}
            <textarea placeholder={CHECKOUT_CONFIG.SHIPPING_FIELDS[2]} rows={3} className="w-full rounded-xl border bg-input px-4 py-2.5 outline-none focus:border-primary"></textarea>
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2"><CreditCard size={18} /> Phương thức</h3>
            <div className="space-y-2">
              {CHECKOUT_CONFIG.PAYMENT_METHODS.map((m, i) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${i === 0 ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <input type="radio" name="payment" defaultChecked={i === 0} className="accent-primary" />
                  <span className="text-sm">{m}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <div>
          <div className="rounded-2xl border bg-card p-6 sticky top-20">
            <h3 className="mb-4 font-semibold text-lg">Đơn hàng</h3>
            <div className="space-y-3 mb-6">
              {CHECKOUT_CONFIG.ORDER_TOTALS.map((item) => (
                <div key={item.label} className="flex justify-between text-sm"><span>{item.label}</span><span className={(item as any).highlight ? "text-primary" : undefined}>{item.value}</span></div>
              ))}
              <hr className="my-2 border-border" />
              <div className="flex justify-between font-bold text-lg"><span>Tổng cộng</span><span className="text-primary">{CHECKOUT_CONFIG.GRAND_TOTAL}</span></div>
            </div>
            <Btn onClick={() => setView(VIEW_KEYS.SUCCESS)} className="w-full">Xác nhận đặt hàng</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Success({ setView }: any) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 grid size-20 place-items-center rounded-full bg-green-100 text-green-600">
        <PackageCheck size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Đặt hàng thành công!</h2>
      <p className="mb-8 text-muted-foreground">Mã đơn hàng của bạn là #SB12345. Chúng tôi sẽ sớm giao hàng đến bạn.</p>
      <Btn onClick={() => setView(VIEW_KEYS.HOME)}>Về trang chủ</Btn>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<typeof VIEW_KEYS[keyof typeof VIEW_KEYS]>(VIEW_KEYS.HOME);

  if (view === VIEW_KEYS.ADMIN) return <AdminPanel onExit={() => setView(VIEW_KEYS.HOME)} />;
  if (view === VIEW_KEYS.LOGIN) return <AuthPage onSuccess={() => setView(VIEW_KEYS.HOME)} onAdminDemo={() => setView(VIEW_KEYS.ADMIN)} />;
  if (view === VIEW_KEYS.REVIEW) return <ReviewPage />;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Header view={view} setView={setView} navPages={navPages} />
      <main className="min-h-[calc(100vh-400px)]">
        {view === VIEW_KEYS.HOME && <Home setView={setView} />}
        {view === VIEW_KEYS.CART && <Cart setView={setView} />}
        {view === VIEW_KEYS.CHECKOUT && <Checkout setView={setView} />}
        {view === VIEW_KEYS.SUCCESS && <Success setView={setView} />}
        {view === VIEW_KEYS.DETAIL && <ProductDetail setView={setView} />}
        {[VIEW_KEYS.SWEETS, "Bánh sinh nhật", "Bánh mousse", VIEW_KEYS.DRINKS].includes(view) && <ProductListing category={view} setView={setView} />}
      </main>
      <Footer />
    </div>
  );
}
