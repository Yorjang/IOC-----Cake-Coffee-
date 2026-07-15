import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { VIEW_KEYS } from "../../config/appConfig";

export function Footer({ setView }: { setView?: (view: string) => void }) {
  return (
    <footer className="bg-background text-foreground border-t">
      <div className="w-full px-2 sm:px-4 lg:px-4 py-12 md:py-16">
        {/* Top Section - Link Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {[
            { title: "Về Sweet Bean", links: ["Về chúng tôi", "Cà phê của chúng tôi", "Câu chuyện thương hiệu", "Tuyển dụng"] },
            { title: "Cửa hàng", links: ["Bánh sinh nhật", "Bánh mousse", "Cafe & Trà", "Combo ưu đãi"] },
            { title: "Hỗ trợ", links: ["Theo dõi đơn hàng", "Hướng dẫn đặt bánh", "Liên hệ chúng tôi"] },
            { title: "Đối tác", links: ["Cung cấp nguyên liệu", "Nhượng quyền", "Khách hàng doanh nghiệp"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-base font-semibold mb-6 text-foreground">{col.title}</h4>
              <ul className="space-y-5">
                {col.links.map(l => (
                  <li key={l}>
                    <button 
                      onClick={() => {
                        if (l === "Hướng dẫn đặt bánh") setView?.(VIEW_KEYS.ORDER_GUIDE);
                      }} 
                      className="text-[15px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-border/40" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            {/* Social Icons */}
            <div className="flex items-center gap-4 shrink-0">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-foreground text-background hover:opacity-80 transition"><Facebook size={16} fill="currentColor" className="border-none"/></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-foreground text-background hover:opacity-80 transition"><Instagram size={16} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-foreground text-background hover:opacity-80 transition"><Youtube size={16} fill="currentColor" /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-foreground text-background hover:opacity-80 transition"><Twitter size={16} fill="currentColor" /></a>
            </div>

            {/* Horizontal Links */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span onClick={() => setView?.(VIEW_KEYS.PRIVACY)} className="cursor-pointer text-[15px] font-medium hover:underline">
                Chính sách bảo mật
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">|</span>
              <span onClick={() => setView?.(VIEW_KEYS.RETURN_POLICY)} className="cursor-pointer text-[15px] font-medium hover:underline">
                Chính sách đổi trả
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">|</span>
              <span onClick={() => setView?.(VIEW_KEYS.TERMS)} className="cursor-pointer text-[15px] font-medium hover:underline">
                Điều khoản dịch vụ
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">|</span>
              <span className="cursor-pointer text-[15px] font-medium hover:underline">
                Tùy chọn Cookie
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            {MESSAGES.FOOTER_RIGHTS}
          </div>
        </div>
      </div>
    </footer>
  );
}
