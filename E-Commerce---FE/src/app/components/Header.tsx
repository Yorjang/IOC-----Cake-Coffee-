import { useState } from "react";
import { Search, Heart, ShoppingBag, User, Menu, CakeSlice, LogIn } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { HEADER_CONFIG, VIEW_KEYS } from "../../config/appConfig";

export function Header({
  view,
  setView,
  navPages,
  wishlistCount = 0,
  cartCount = 0,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  isLoggedIn = false,
}: any) {
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
        <div className="hidden w-56 items-center gap-2 rounded-full border bg-card px-3 py-1.5 md:flex focus-within:ring-2 focus-within:ring-primary/40">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={MESSAGES.HEADER_SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit?.();
              }
            }}
            className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.FAVORITES)}
          className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.FAVORITES ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          title={MESSAGES.HEADER_FAVORITE}
        >
          <Heart size={20} className={view === VIEW_KEYS.FAVORITES ? "fill-current" : ""} />
          {wishlistCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{wishlistCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.CART)}
          className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.CART ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          title={MESSAGES.HEADER_CART}
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{cartCount}</span>
          )}
        </button>
        {isLoggedIn ? (
          <button type="button" onClick={() => setView(VIEW_KEYS.PROFILE)} className={`rounded-full p-2 transition ${view === VIEW_KEYS.PROFILE ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`} title={MESSAGES.HEADER_PROFILE}>
            <User size={18} />
          </button>
        ) : (
          <button type="button" onClick={() => setView(VIEW_KEYS.LOGIN)} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-sm hover:bg-secondary transition" title={MESSAGES.HEADER_LOGIN}>
            <LogIn size={14} />
            <span className="hidden sm:inline">{MESSAGES.HEADER_LOGIN}</span>
          </button>
        )}
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
