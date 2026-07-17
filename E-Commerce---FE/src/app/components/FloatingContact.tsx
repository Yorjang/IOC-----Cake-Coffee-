import { useState } from "react";
import { Phone, ChevronUp, X } from "lucide-react";

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-6 z-[99] flex flex-col items-center gap-3">
      {/* Contact Methods */}
      <div 
        className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
        }`}
      >
        <a 
          href="tel:1900636302" 
          className="w-11 h-11 bg-[#8c6b4f] hover:bg-[#6c513b] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          title="Gọi điện thoại"
        >
          <Phone size={20} />
        </a>
        <a 
          href="https://zalo.me/" 
          target="_blank" 
          rel="noreferrer"
          className="w-11 h-11 bg-[#8c6b4f] hover:bg-[#6c513b] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          title="Zalo"
        >
          <span className="font-bold text-xs">Zalo</span>
        </a>
      </div>

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 bg-[#cca77b] hover:bg-[#b78b5e] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 relative mt-2"
        title="Liên hệ"
      >
        <ChevronUp size={24} className={`absolute transition-transform duration-300 ${isOpen ? "rotate-180 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}`} />
        <X size={24} className={`absolute transition-transform duration-300 ${isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-180 opacity-0 scale-50"}`} />
      </button>
    </div>
  );
}
