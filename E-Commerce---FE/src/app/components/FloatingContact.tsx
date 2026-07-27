import { ChevronUp, Facebook, Instagram, PackageSearch, Twitter, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

interface FloatingContactProps {
  onTrackOrder?: () => void;
  showOrderTracking?: boolean;
}

export function FloatingContact({
  onTrackOrder,
  showOrderTracking = false,
}: FloatingContactProps) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-8 right-6 z-[999] flex flex-col items-center gap-3">
      {showOrderTracking && onTrackOrder && (
        <button
          type="button"
          onClick={onTrackOrder}
          className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90"
          title="Theo dõi đơn hàng"
          aria-label="Theo dõi đơn hàng"
        >
          <PackageSearch size={22} />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Theo dõi đơn hàng
          </span>
        </button>
      )}

      {/* Facebook */}
      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3d2314] text-white shadow-lg hover:opacity-80 transition">
        <Facebook size={20} fill="currentColor" className="border-none" />
      </a>

      {/* Instagram */}
      <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3d2314] text-white shadow-lg hover:opacity-80 transition">
        <Instagram size={20} />
      </a>

      {/* Youtube */}
      <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3d2314] text-white shadow-lg hover:opacity-80 transition">
        <Youtube size={20} fill="currentColor" />
      </a>

      {/* Twitter */}
      <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3d2314] text-white shadow-lg hover:opacity-80 transition">
        <Twitter size={20} fill="currentColor" />
      </a>

      {/* Scroll to Top */}
      <div 
        className={`mt-4 transition-all duration-300 ease-in-out cursor-pointer ${showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        onClick={scrollToTop}
      >
        <div className="flex items-center justify-center w-[52px] h-[52px] rounded-full border-[2.5px] border-[#c0b5a6] bg-transparent text-[#897364] hover:bg-white/50 transition">
          <div className="flex items-center justify-center w-11 h-11 rounded-full border-[1.5px] border-[#c0b5a6] bg-white text-[#897364]">
            <ChevronUp size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
