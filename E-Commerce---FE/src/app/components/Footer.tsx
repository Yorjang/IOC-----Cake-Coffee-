import { CakeSlice, Facebook, Instagram } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { VIEW_KEYS } from "../../config/appConfig";

export function Footer({ setView }: { setView?: (view: string) => void }) {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-primary"><CakeSlice size={16} className="text-primary-foreground" /></span>
              <span className="font-serif text-xl font-bold">{env.APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-sidebar-foreground/70">{MESSAGES.FOOTER_DESC}</p>
            <div className="mt-4 flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-foreground hover:bg-primary hover:text-primary-foreground transition"><Facebook size={14} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-foreground hover:bg-primary hover:text-primary-foreground transition"><Instagram size={14} /></a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-foreground hover:bg-primary hover:text-primary-foreground transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
            </div>
          </div>
          {[
            { title: "Cửa hàng", links: ["Bánh sinh nhật", "Bánh mousse", "Cafe & Trà", "Combo ưu đãi"] },
            { title: "Hỗ trợ", links: ["Theo dõi đơn hàng", "Chính sách đổi trả", "Hướng dẫn đặt bánh", "Liên hệ chúng tôi", "Chính sách bảo mật", "Điều khoản dịch vụ"] },
            { title: "Voucher", links: ["CAKE10 — giảm 10%", "COFFEE20 — giảm 20%", "COMBO15 — giảm 15%", "NEWUSER50 — -50k"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map(l => <li key={l} onClick={() => {
                  if (l === "Chính sách bảo mật") setView?.(VIEW_KEYS.PRIVACY);
                  if (l === "Điều khoản dịch vụ") setView?.(VIEW_KEYS.TERMS);
                  if (l === "Chính sách đổi trả") setView?.(VIEW_KEYS.RETURN_POLICY);
                  if (l === "Hướng dẫn đặt bánh") setView?.(VIEW_KEYS.ORDER_GUIDE);
                }} className="text-sm text-sidebar-foreground/65 hover:text-sidebar-foreground cursor-pointer transition">{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-sidebar-accent pt-6 text-xs text-sidebar-foreground/55">
          <p>{MESSAGES.FOOTER_RIGHTS}</p>
          <div className="flex gap-4">
            {["Điều khoản", "Bảo mật", "Cookie"].map(l => <span key={l} onClick={() => {
              if (l === "Điều khoản") setView?.(VIEW_KEYS.TERMS);
              if (l === "Bảo mật") setView?.(VIEW_KEYS.PRIVACY);
            }} className="cursor-pointer hover:text-sidebar-foreground transition">{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
