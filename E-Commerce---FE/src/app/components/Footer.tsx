import { CakeSlice } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";

export function Footer() {
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
              {["FB", "IG", "TT"].map(s => <button key={s} className="size-8 rounded-full bg-sidebar-accent text-xs text-sidebar-foreground hover:bg-primary transition">{s}</button>)}
            </div>
          </div>
          {[
            { title: "Cửa hàng", links: ["Bánh sinh nhật", "Bánh mousse", "Cafe & Trà", "Combo ưu đãi"] },
            { title: "Hỗ trợ", links: ["Theo dõi đơn hàng", "Chính sách đổi trả", "Hướng dẫn đặt bánh", "Liên hệ chúng tôi"] },
            { title: "Voucher", links: ["CAKE10 — giảm 10%", "COFFEE20 — giảm 20%", "COMBO15 — giảm 15%", "NEWUSER50 — -50k"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map(l => <li key={l} className="text-sm text-sidebar-foreground/65 hover:text-sidebar-foreground cursor-pointer transition">{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-sidebar-accent pt-6 text-xs text-sidebar-foreground/55">
          <p>{MESSAGES.FOOTER_RIGHTS}</p>
          <div className="flex gap-4">
            {["Điều khoản", "Bảo mật", "Cookie"].map(l => <span key={l} className="cursor-pointer hover:text-sidebar-foreground transition">{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
