import { useState, useEffect } from "react";
import { Facebook, Instagram, Youtube, Twitter, ChevronUp } from "lucide-react";

export function FloatingContact() {
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
