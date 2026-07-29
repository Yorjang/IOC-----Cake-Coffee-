<<<<<<< Updated upstream
import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Truck, Gift, RefreshCw, Coffee, AlertCircle, Check, Tag, ChevronRight, ChevronLeft, Plus, MapPin, Loader2, PlayCircle, BookOpen, Users, ChefHat } from "lucide-react";
import { ProductCard, HorizontalProductCard, Section } from "../components/shared";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { HOME_CONFIG, VIEW_KEYS } from "../../config/appConfig";
import { getFeaturedParentCategories } from "../features/categories/categoryHierarchy";
=======
import React from 'react';
import { motion } from 'motion/react';
import { FadingVideo } from '../components/FadingVideo';
import { BlurText } from '../components/BlurText';
import { ArrowUpRight, Play, Clock, Globe, Image as ImageIcon, Film, Lightbulb } from 'lucide-react';
>>>>>>> Stashed changes

export function Home() {
  return (
    <div className="bg-black min-h-screen text-white font-body selection:bg-white/20" style={{ backgroundColor: '#000' }}>
      {/* SECTION 1: HERO */}
      <section className="relative w-full h-screen overflow-hidden flex flex-col">
        {/* Background Video */}
        <FadingVideo 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />

        {/* Navbar */}
        <nav className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex items-center justify-between">
          <div className="w-12 h-12 liquid-glass rounded-full flex items-center justify-center font-heading italic text-3xl lowercase pb-1">a</div>
          
          <div className="hidden md:flex items-center liquid-glass rounded-full p-1.5 gap-1">
            {['Home', 'Voyages', 'Worlds', 'Innovation', 'Plan Launch'].map((item) => (
              <a key={item} href="#" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:bg-white/10 rounded-full transition-colors">
                {item}
              </a>
            ))}
            <button className="ml-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 whitespace-nowrap">
              Claim a Spot <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="w-12 h-12 invisible"></div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          <motion.div 
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: 'easeOut' }}
            className="liquid-glass rounded-full flex items-center p-1 pr-3 gap-2 mb-6"
          >
            <span className="bg-white text-black px-3 py-1 text-xs font-semibold rounded-full">New</span>
            <span className="text-sm text-white/90">Maiden Crewed Voyage to Mars Arrives 2026</span>
          </motion.div>

          <BlurText 
            text="Venture Past Our Sky Across the Universe"
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl justify-center tracking-[-4px]"
          />

          <motion.p 
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ delay: 0.8, ease: 'easeOut' }}
            className="mt-4 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>

          <motion.div 
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ delay: 1.1, ease: 'easeOut' }}
            className="flex items-center gap-6 mt-6"
          >
            <button className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
              Start Your Voyage <ArrowUpRight className="h-5 w-5" />
            </button>
            <button className="text-sm font-medium text-white flex items-center gap-2 hover:text-white/80 transition-colors">
              View Liftoff <Play className="h-4 w-4 fill-current" />
            </button>
          </motion.div>

          <motion.div 
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ delay: 1.3, ease: 'easeOut' }}
            className="flex flex-wrap justify-center items-stretch gap-4 mt-8"
          >
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between text-left h-[140px]">
              <Clock className="w-7 h-7 text-white stroke-[1.5]" />
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">34.5 Min</div>
                <div className="text-xs text-white font-body font-light mt-2">Average Videos Watch Time</div>
              </div>
            </div>
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col justify-between text-left h-[140px]">
              <Globe className="w-7 h-7 text-white stroke-[1.5]" />
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">2.8B+</div>
                <div className="text-xs text-white font-body font-light mt-2">Users Across the Globe</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Partners */}
        <motion.div 
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ delay: 1.4, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center gap-4 pb-8 pt-8"
        >
          <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
            Collaborating with top aerospace pioneers globally
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 font-heading italic text-white text-2xl md:text-3xl tracking-tight">
            <span>Aeon</span>
            <span>Vela</span>
            <span>Apex</span>
            <span>Orbit</span>
            <span>Zeno</span>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: CAPABILITIES */}
      <section className="relative w-full min-h-screen flex flex-col">
        {/* Background Video */}
        <FadingVideo 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
          <div className="mb-auto">
            <div className="text-sm font-body text-white/80 mb-6">// Capabilities</div>
            <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
              Production<br/>evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {/* Card 1 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {['Natural Context', 'Photo Realism', 'Infinite Settings', 'Eco-Vibe'].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">AI Scenery</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {['Scale Fast', 'Visual Consistency', 'Time Saver', 'Ready to Post'].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Batch Production</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 liquid-glass rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {['Ray Tracing', 'Physical Shadows', 'Studio Quality', 'Sunlight Sync'].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Smart Lighting</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
<<<<<<< Updated upstream

function ScrollingBestSellers({ products: rawProducts = [], onSelectProduct, onAddToCart }: any) {
  const products = Array.isArray(rawProducts) ? rawProducts : (Array.isArray(rawProducts?.data) ? rawProducts.data : []);
  const displayProducts = [...products, ...products, ...products, ...products];

  return (
    <section className="py-20 overflow-hidden bg-[#f4f2ec]">
      <style>{`
        @keyframes custom-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          animation: custom-marquee 40s linear infinite;
        }
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
      <h2 className="text-center text-[36px] md:text-[46px] text-[#3d2314] mb-12 tracking-wide font-bold uppercase" style={{ fontFamily: "'Bodoni Moda', serif" }}>
        Best Seller
      </h2>
      <div className="relative w-full flex">
        <div className="flex gap-4 md:gap-6 min-w-max px-6 animate-marquee-infinite will-change-transform">
          {displayProducts.map((p, i) => (
            <HorizontalProductCard key={`bs-${i}`} p={p} onSelect={onSelectProduct} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Home({ setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist, products: rawProducts = [], categories: rawCategories = [], publicCoupons: rawCoupons = [] }: any) {
  const products = Array.isArray(rawProducts) ? rawProducts : (Array.isArray(rawProducts?.data) ? rawProducts.data : (Array.isArray(rawProducts?.products) ? rawProducts.products : []));
  const categories = Array.isArray(rawCategories) ? rawCategories : (Array.isArray(rawCategories?.data) ? rawCategories.data : (Array.isArray(rawCategories?.categories) ? rawCategories.categories : []));
  const featuredCategories = useMemo(
    () => getFeaturedParentCategories(categories),
    [categories],
  );
  const publicCoupons = Array.isArray(rawCoupons) ? rawCoupons : (Array.isArray(rawCoupons?.data) ? rawCoupons.data : (Array.isArray(rawCoupons?.coupons) ? rawCoupons.coupons : []));
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState<Array<{ src: string; alt: string; title?: string; subtitle?: string; linkUrl?: string }>>(() => {
    try {
      const cached = localStorage.getItem("sb_cached_banners");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((b: any) => b.src && !b.src.includes("unsplash.com"));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (_) {}
    return [];
  });
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

  useEffect(() => { 
    let cancelled = false; 
    fetch(`${env.API_URL}/banners/public`)
      .then(response => response.ok ? response.json() : Promise.reject(response.status))
      .then(data => { 
        const rawBanners = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const next = Array.isArray(rawBanners) 
          ? rawBanners.filter((banner: any) => banner.imageUrl).map((banner: any) => ({ 
              src: banner.imageUrl, 
              alt: banner.title || "Sweet Bean promotion", 
              title: banner.title, 
              subtitle: banner.subtitle, 
              linkUrl: banner.linkUrl 
            })) 
          : []; 
        if (!cancelled && next.length) { 
          // Save to localStorage for instant 0ms reload next time
          try {
            localStorage.setItem("sb_cached_banners", JSON.stringify(next));
          } catch (_) {}

          // Preload images immediately in browser cache
          next.forEach(b => {
            const img = new Image();
            img.src = b.src;
          });
          setBanners(next); 
        } 
      })
      .catch(() => { }); 
    return () => { cancelled = true; }; 
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, HOME_CONFIG.HERO_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeBanner];
  return (
    <>
      {/* ── Hero banner ── */}
      {banners.length > 0 && (
        <section className="relative w-full overflow-hidden bg-black group">
          <style>{`
            @keyframes slideUpFade {
              0% { opacity: 0; transform: translateY(40px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .slide-up-fade {
              animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              opacity: 0;
            }
            .delay-100 { animation-delay: 0.1s; }
            .delay-200 { animation-delay: 0.2s; }
            .delay-300 { animation-delay: 0.3s; }
            .delay-400 { animation-delay: 0.4s; }
            .delay-500 { animation-delay: 0.5s; }
          `}</style>

          <div className="relative w-full h-[240px] sm:h-[340px] md:h-[440px] lg:h-[480px] overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.src}
                className={`absolute inset-0 h-full w-full transition-opacity duration-300 ease-out ${activeBanner === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              >
                <img 
                  src={banner.src} 
                  alt={banner.alt} 
                  loading={index === 0 ? "eager" : "lazy"}
                  // @ts-ignore
                  fetchpriority={index === 0 ? "high" : "low"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none" 
                />
              </div>
            ))}
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 w-full z-20">
              {banners.map((banner, index) => (
                <button key={banner.alt} type="button" aria-label={`Chuyển sang banner ${index + 1}`} onClick={() => setActiveBanner(index)}
                  className={`h-2 rounded-full transition-all duration-500 shadow-sm ${activeBanner === index ? "w-10 bg-[#fca5a5]" : "w-3 bg-white hover:bg-white/80"}`} />
              ))}
            </div>
          </div>

          {/* Prev/Next Navigation (SugarTown style) */}
          <button
            onClick={() => setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white text-[#5b4539] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg z-30"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setActiveBanner((prev) => (prev + 1) % banners.length)}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white text-[#5b4539] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg z-30"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </section>
      )}

      {/* ── Value Propositions Strip (SugarTown style) ── */}
      <div className="relative bg-transparent text-[#2d1a13] py-6 md:py-8">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
            
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <Truck size={36} strokeWidth={1.2} className="shrink-0 text-[#60493b]" />
              <div className="text-left">
                <div className="text-lg md:text-xl font-semibold tracking-tight mb-0.5">Freeship</div>
                <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-[#d68b6b] uppercase leading-snug">Đơn từ 200k<br/>Bán kính 3km</div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4">
              <Gift size={36} strokeWidth={1.2} className="shrink-0 text-[#60493b]" />
              <div className="text-left">
                <div className="text-lg md:text-xl font-semibold tracking-tight mb-0.5">Tặng thiệp</div>
                <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-[#d68b6b] uppercase leading-snug">Bánh sinh nhật<br/>đặt trước</div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4">
              <RefreshCw size={36} strokeWidth={1.2} className="shrink-0 text-[#60493b]" />
              <div className="text-left">
                <div className="text-lg md:text-xl font-semibold tracking-tight mb-0.5">Đổi bánh</div>
                <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-[#d68b6b] uppercase leading-snug">Nếu giao sai mẫu<br/>hoặc hư hỏng</div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4">
              <Coffee size={36} strokeWidth={1.2} className="shrink-0 text-[#60493b]" />
              <div className="text-left">
                <div className="text-lg md:text-xl font-semibold tracking-tight mb-0.5">Combo</div>
                <div className="text-[9px] md:text-[10px] font-bold tracking-widest text-[#d68b6b] uppercase leading-snug">Giảm giá thêm<br/>khi mua đồ uống</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Promo Banner (Image 2) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="relative w-full h-[260px] md:h-[320px] overflow-hidden rounded-[20px] bg-[#2d1a13]">
          <img src="https://images.unsplash.com/photo-1495147466023-2ce660b86a88?w=1800&h=600&fit=crop&auto=format" alt="Promo" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2d1a13]/90 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] text-[#d5b89f] uppercase mb-3">Collection Mới</p>
              <h2 className="text-5xl md:text-[64px] text-white leading-tight mb-8" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                <span className="font-normal">Entremet</span><br />
                <span className="italic font-light">Mùa Hè 2024</span>
              </h2>
              <div className="flex items-center gap-6">
                <button onClick={() => setView(VIEW_KEYS.SWEETS)} className="bg-white text-black px-8 py-3.5 text-sm font-semibold tracking-wider flex items-center gap-2 hover:bg-white/90 transition shadow-lg">
                  XEM NGAY <span className="text-xl leading-none">&rsaquo;</span>
                </button>
                <span className="text-white/60 text-sm hidden sm:inline-block">Đặt trước 48 giờ</span>
              </div>
            </div>

            <div className="hidden md:flex size-[130px] rounded-full bg-[#d5b89f] items-center justify-center flex-col shadow-2xl mr-4 border-4 border-[#2d1a13]/20">
              <span className="text-4xl font-bold text-[#2d1a13] leading-none" style={{ fontFamily: "'Bodoni Moda', serif" }}>-10%</span>
              <span className="text-[11px] font-bold text-[#2d1a13] tracking-widest mt-1">ĐƠN ĐẦU</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured categories ── */}
      <Section title={MESSAGES.SECTION_CATEGORIES_TITLE}>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {featuredCategories.map((c) => (
            <button key={c.name} onClick={() => setView(c.name)} className="group flex flex-col w-full aspect-[4/5] sm:aspect-square overflow-hidden rounded-[20px] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-black/5">
              <div className="relative h-[75%] w-full overflow-hidden bg-muted">
                <img src={c.img} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
              <div className="h-[25%] flex items-center justify-center bg-white pb-1">
                <p className="text-[13px] md:text-[15px] font-bold text-[#3d2314] group-hover:text-[#b99368] transition-colors">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Deal ngọt + Vouchers ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-muted-foreground mb-1">SWEET BEAN COFFEE & CAKE</p>
            <h2 className="text-4xl md:text-[42px] text-foreground leading-none" style={{ fontFamily: "'Bodoni Moda', serif", fontWeight: 700 }}>
              Deal ngọt hôm nay
            </h2>
            <p className="mt-2 text-sm text-foreground/80">Giá ưu đãi có thời hạn, phù hợp để tặng đơn nhanh và gợi ý mua kèm</p>
          </div>
          <button onClick={() => setView(VIEW_KEYS.COMBO)} className="shrink-0 rounded-full bg-[#f4dcc6] text-foreground px-6 py-2.5 text-[13px] font-semibold transition hover:bg-[#e6cbb4]">
            Xem tất cả
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Flash deal card */}
          <div className="relative overflow-hidden rounded-[20px] h-96 lg:h-[460px]">
            <img src={products[4]?.[3] || products[0]?.[3] || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1800&h=650&fit=crop&auto=format"} alt="Flash deal" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 w-full md:w-2/3">
              <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#6f3f26]/90 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                <Tag size={12} />
                Flash deal đến 16:00
              </span>
              <h3 className="text-3xl md:text-[36px] font-bold text-white leading-tight mb-2" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                Combo Tiramisu + Latte
              </h3>
              <p className="text-sm md:text-[15px] text-white/80 leading-relaxed max-w-md">
                Gợi ý mua kèm đang bán tốt nhất hôm nay, phù hợp cho khách văn phòng và đơn giao nhanh.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[28px] font-bold text-[#e8a9ad]">89.000đ</span>
                <span className="text-sm text-white/50 line-through mt-2">109.000đ</span>
                <span className="rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[11px] text-white/90 mt-2">
                  Tiết kiệm 20.000đ
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setView(VIEW_KEYS.COMBO)} className="rounded-full bg-[#6f3f26] px-7 py-3 text-sm font-semibold text-white hover:bg-[#6f3f26]/90 transition">
                  Xem combo
                </button>
                <button onClick={() => {
                  const dealProduct = products[4] || products[0];
                  if (dealProduct) onAddToCart?.(dealProduct);
                }} className="rounded-full border border-white/40 bg-transparent px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>

          {/* Vouchers panel */}
          <div className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-border bg-card p-6 flex flex-col h-[460px]">
              <div className="mb-5 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">VOUCHER ĐANG CHẠY</p>
                  <h3 className="text-[22px] font-bold text-foreground leading-none" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                    Mã giảm giá dễ dùng
                  </h3>
                </div>
                <Tag size={20} className="text-muted-foreground/60" />
              </div>
              <div className="space-y-4 overflow-y-auto pr-1 pb-1 scrollbar-hide">
                {displayVouchers.map((v: any) => <VoucherRow key={v.code} {...v} onClick={() => setSelectedVoucher(v)} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Best sellers ── */}
      <ScrollingBestSellers
        products={products.slice(0, HOME_CONFIG.BEST_SELLERS_LIMIT)}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
      />

      {/* ── New + combos ── */}
      <Section title={MESSAGES.SECTION_NEW_COMBOS_TITLE} onViewAll={() => setView(VIEW_KEYS.COMBO)}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(HOME_CONFIG.NEW_COMBOS_START, HOME_CONFIG.NEW_COMBOS_END).map(p => (
            <ProductCard key={p[0]} p={p} onSelect={onSelectProduct} isWishlisted={wishlist.some((w: any) => w[0] === p[0])} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} />
          ))}
        </div>
      </Section>

      {/* ── About Us ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <h2 className="text-center text-3xl md:text-[36px] text-[#b99368] font-bold mb-12 uppercase" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Về Chúng Tôi
        </h2>
        <div className="grid gap-12 md:grid-cols-2 items-start">
          {/* Left image */}
          <div className="w-full h-[400px] md:h-[700px] overflow-hidden rounded-xl shadow-sm">
            <img src="https://images.unsplash.com/photo-1556910103-1c02745a872f?w=1200&h=1600&fit=crop" alt="Về Chúng Tôi" className="w-full h-full object-cover" />
          </div>

          {/* Right content */}
          <div className="flex flex-col justify-center px-2 md:px-6">
            <div className="text-center mb-8 mt-2 md:mt-10">
              <p className="text-[#b99368] text-[12px] md:text-[13px] font-bold tracking-[0.15em] uppercase mb-2">
                A TASTE OF TIME, A TIMELESS MOMENT
              </p>
              <h3 className="text-[#b99368] text-[16px] md:text-lg uppercase font-bold tracking-widest" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Vị Nguyên Bản, Chút Hoài Niệm Gửi Trao
              </h3>
            </div>

            <div className="space-y-6 text-[#4a4a4a] text-[14px] leading-relaxed text-justify">
              <div>
                <p className="font-bold italic text-[#222] mb-3">#Nét thanh lịch truyền thống trong từng hương vị mộc mạc</p>
                <p>Sweet Bean được tạo nên từ sự trân trọng những giá trị nguyên bản và nghệ thuật thủ công tinh tế. Không cầu kỳ phô trương, sự giao thoa giữa những chiếc bánh nướng tỉ mỉ và thức uống đượm vị tại đây là kết quả của một quá trình chắt lọc khắt khe. Gìn giữ nét cổ điển trong từng kỹ thuật làm bánh, hòa cùng nhịp điệu tự nhiên của lá trà, hạt cà phê, chúng tôi mang đến một trải nghiệm vị giác thanh tao, nguyên sơ và sâu lắng.</p>
              </div>

              <div>
                <p className="font-bold italic text-[#222] mb-3">#Chốn dừng chân lưu giữ những thước phim của thời gian</p>
                <p>Giữa nhịp sống vội vã, Sweet Bean tựa như một nốt trầm êm ả. Một tách trà ấm, một phần bánh ngọt không chỉ đơn thuần là ẩm thực, mà còn là không gian để người ta thực sự ngồi lại bên nhau. Chúng tôi tin rằng những điều đẹp đẽ nhất luôn hiện diện trong những phút giây bình dị nhất. Sẻ chia một miếng bánh, nhâm nhi một ngụm trà là cùng nhau cất giữ một miền ký ức vẹn nguyên.</p>
              </div>

              <p>Dù là một chiều thảnh thơi lật giở những trang sách, hay một buổi hội ngộ hàn huyên cùng tri kỷ, Sweet Bean luôn giữ sẵn một góc nhỏ an yên, để bạn chậm lại và trọn vẹn thưởng thức phong vị của cuộc sống.</p>
            </div>

            <div className="mt-10 flex justify-center">
              <button className="bg-[#b99368] hover:bg-[#a68058] text-white px-8 py-2.5 font-bold transition rounded-sm shadow-sm text-sm">
                ĐỌC THÊM
              </button>
            </div>
          </div>
        </div>
      </section>



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
=======
>>>>>>> Stashed changes
