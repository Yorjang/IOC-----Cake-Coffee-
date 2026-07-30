import { useState, useEffect } from "react";
import { Facebook, Instagram, MapPin, Mail, Phone } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { VIEW_KEYS } from "../../config/appConfig";
import { env } from "../../config/env";

export function Footer({ setView }: { setView?: (view: string) => void }) {
  const [bgImage, setBgImage] = useState(() => {
    try {
      const cached = localStorage.getItem("sb_cached_footer_bg");
      if (cached && !cached.includes("unsplash.com")) return cached;
    } catch (_) { }
    return "";
  });

  useEffect(() => {
    let cancelled = false;
    const fetchFooterImage = async () => {
      try {
        const res = await fetch(`${env.API_URL}/banners/public`);
        if (!res.ok) return;
        const data = await res.json();
        const rawBanners = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        if (!cancelled && rawBanners.length > 0) {
          const footerBanner = rawBanners.find((b: any) =>
            b.position === 'footer' && b.imageUrl
          );
          if (footerBanner) {
            setBgImage(footerBanner.imageUrl);
            try {
              localStorage.setItem("sb_cached_footer_bg", footerBanner.imageUrl);
            } catch (_) { }
          }
        }
      } catch (err) { }
    };

    fetchFooterImage();
    return () => { cancelled = true; };
  }, []);

  return (
    <footer
      className={`relative text-white border-t border-black/20 pt-16 pb-12 overflow-hidden bg-cover bg-center transition-all duration-700 ${bgImage ? "" : "bg-[#2d1a15]"}`}
      style={bgImage ? { backgroundImage: `url("${bgImage}")` } : undefined}
    >
      <div className="absolute inset-0 bg-black/20" /> {/* Slight dark tint for text readability, but much lighter than before */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 drop-shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Column 1: About & Info */}
          <div className="space-y-5">
            <div style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-[28px] font-bold tracking-wide uppercase text-[#b99368]">
              Sweet Bean
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Công ty Cổ phần Thương mại & Dịch vụ T'Mories đã phục vụ bạn và gia đình từ năm 2010.
            </p>
            <div className="space-y-3 text-sm text-white/80 mt-4">
              <p className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5 text-white/60" />
                <span>42B-TT4, Thành phố Giao Lưu, Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-white/60" />
                <span>tmoriesbakery@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-white/60" />
                <span>0333.802.678</span>
              </p>
            </div>
          </div>

          {/* Column 2: Liên hệ */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white tracking-wide">Liên hệ</h3>
            <div className="space-y-4 text-sm text-white/80 leading-relaxed">
              <p>Hotline: 0333.802.678</p>
              <p>Email: tmoriesbakery@gmail.com</p>
              <p>Mở cửa từ 8h00 – 19h00 các ngày từ thứ 2 đến Chủ nhật</p>
              <p>Tư vấn online từ 8h00 – 21h30</p>
            </div>
          </div>

          {/* Column 3: Chính sách */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white tracking-wide">Chính sách</h3>
            <ul className="space-y-3 text-sm text-white/80">
              {["Giao hàng & Nhận hàng", "Chính sách bảo hành", "Chính sách bảo mật", "Quy định đổi trả hàng", "Chính sách thành viên"].map(l => (
                <li key={l}>
                  <button onClick={() => setView?.(VIEW_KEYS.PRIVACY)} className="hover:text-white transition-colors text-left">{l}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Tuyển dụng */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white tracking-wide">Tuyển dụng</h3>
            <div className="space-y-4 text-sm text-white/80 leading-relaxed">
              <p>
                Chúng tôi luôn tìm kiếm và chào đón những ứng viên đam mê với ngành bánh ngọt và dịch vụ khách hàng.
              </p>
              <p>
                Gửi CV của bạn về email:<br />
                <a href="mailto:tuyendung@tmories.vn" className="text-white hover:text-[#fd6699] font-medium transition-colors">tuyendung@tmories.vn</a>
              </p>
              <button className="inline-block mt-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all text-white font-semibold shadow-sm">
                Xem vị trí đang tuyển
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center justify-center gap-2">
          <div className="text-sm text-white/50 text-center">
            {MESSAGES.FOOTER_RIGHTS}
          </div>
        </div>
      </div>
    </footer>
  );
}
