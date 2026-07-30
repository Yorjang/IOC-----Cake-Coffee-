import { HorizontalProductCard } from "../../../components/shared";

export function ScrollingBestSellers({ products: rawProducts = [], onSelectProduct, onAddToCart }: any) {
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
