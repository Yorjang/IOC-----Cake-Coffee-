import { useState } from "react";
import { Search, Heart, ShoppingBag, User, Menu, CakeSlice, LogIn } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { HEADER_CONFIG, VIEW_KEYS } from "../../config/appConfig";

export function Header({ view, setView, navPages }: any) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button type="button" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>
        <button type="button" onClick={() => setView(VIEW_KEYS.HOME)} className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><CakeSlice size={20} /></span>
          <span className="font-serif text-xl font-bold">Sweet Bean</span>
        </button>
        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {navPages?.map((v: string) => (
            <button type="button" key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-2 text-sm transition ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{v}</button>
          ))}
        </nav>
        <div className="hidden w-56 items-center gap-2 rounded-full border bg-card px-3 py-2 md:flex">
          <Search size={16} /><span className="text-sm text-muted-foreground">{MESSAGES.HEADER_SEARCH_PLACEHOLDER}</span>
        </div>
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.FAVORITES)}
          className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.FAVORITES ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          title={MESSAGES.HEADER_FAVORITE}
        >
          <Heart size={20} className={view === VIEW_KEYS.FAVORITES ? "fill-current" : ""} />
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{HEADER_CONFIG.FAVORITE_COUNT}</span>
        </button>
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.CART)}
          className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.CART ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          title={MESSAGES.HEADER_CART}
        >
          <ShoppingBag size={20} />
          <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{HEADER_CONFIG.CART_COUNT}</span>
        </button>
        <button type="button" onClick={() => setView(VIEW_KEYS.LOGIN)} className="hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-secondary transition">
          <LogIn size={14} /> {MESSAGES.HEADER_LOGIN}
        </button>
        <button type="button" onClick={() => setView(VIEW_KEYS.PROFILE)} className={`rounded-full p-2 transition ${view === VIEW_KEYS.PROFILE ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`} title={MESSAGES.HEADER_PROFILE}>
          <User size={18} />
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t bg-background p-4 lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {navPages?.map((v: string) => (
              <button type="button" key={v} onClick={() => { setView(v); setMobileOpen(false); }} className={`rounded-xl p-2.5 text-sm text-left transition ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>{v}</button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
