import { useState } from "react";
import { Search, Heart, ShoppingBag, User, Menu, CakeSlice, LogIn, MapPin, ChevronDown } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { HEADER_CONFIG, VIEW_KEYS } from "../../config/appConfig";

const BRANCHES = ["Sweet Bean Quận 1", "Sweet Bean Quận 3", "Sweet Bean Bình Thạnh"];

export function Header({
  view, setView, navPages, wishlistCount = 0, cartCount = 0,
  searchQuery = "", onSearchChange, onSearchSubmit, isLoggedIn = false,
  user, products = [],
}: any) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showSuggestions = isFocused && searchQuery.trim().length > 0;
  const suggestions = showSuggestions
    ? products
        .filter((p: any) => p[0].toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button type="button" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button>

        {/* Logo */}
        <button type="button" onClick={() => setView(VIEW_KEYS.HOME)} className="flex items-center gap-2 shrink-0">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><CakeSlice size={18} /></span>
          <span className="font-serif text-xl font-bold hidden sm:block">Sweet Bean</span>
        </button>

        {/* Nav */}
        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {navPages?.map((v: string) => (
            <button type="button" key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-2 text-sm transition ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{v}</button>
          ))}
        </nav>

        {/* Store selector */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setBranchOpen(!branchOpen)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition"
          >
            <MapPin size={12} className="text-primary shrink-0" />
            <span className="max-w-[130px] truncate">{branch}</span>
            <ChevronDown size={12} className={`transition-transform ${branchOpen ? "rotate-180" : ""}`} />
          </button>
          {branchOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border bg-background shadow-lg z-50">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => { setBranch(b); setBranchOpen(false); }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-secondary transition first:rounded-t-xl last:rounded-b-xl ${b === branch ? "text-primary font-semibold" : "text-foreground"}`}
                >
                  <MapPin size={12} className="text-primary shrink-0" />
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative hidden w-64 items-center gap-2 rounded-full border bg-card px-3 py-1.5 md:flex focus-within:ring-2 focus-within:ring-primary/40">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={MESSAGES.HEADER_SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit?.();
                setIsFocused(false);
              }
            }}
            className="w-full bg-transparent text-sm outline-none border-none p-0 focus:ring-0 placeholder:text-muted-foreground/60 text-foreground"
          />

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border bg-card p-2 shadow-lg max-h-[300px] overflow-y-auto animate-fadeIn">
              {suggestions.map((p: any) => (
                <button
                  key={p[0]}
                  type="button"
                  onClick={() => {
                    setView(VIEW_KEYS.DETAIL, p);
                    onSearchChange?.(""); // Clear search to close suggestion dropdown
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-secondary transition text-left"
                >
                  <img src={p[3]} alt="" className="size-10 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground line-clamp-1">{p[0]}</div>
                    <div className="text-[10px] text-muted-foreground">{p[2]}</div>
                  </div>
                  <div className="text-xs font-bold text-primary shrink-0">{p[1]}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icons */}
        <button type="button" onClick={() => setView(VIEW_KEYS.FAVORITES)} className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.FAVORITES ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`} title={MESSAGES.HEADER_FAVORITE}>
          <Heart size={20} className={view === VIEW_KEYS.FAVORITES ? "fill-current" : ""} />
          {wishlistCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{wishlistCount}</span>}
        </button>
        <button type="button" onClick={() => setView(VIEW_KEYS.CART)} className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.CART ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`} title={MESSAGES.HEADER_CART}>
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{cartCount}</span>}
        </button>
        {isLoggedIn ? (
          <button type="button" onClick={() => setView(VIEW_KEYS.PROFILE)} className={`w-[34px] h-[34px] rounded-full transition overflow-hidden flex items-center justify-center border shrink-0 ${view === VIEW_KEYS.PROFILE ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border hover:bg-accent"}`} title={MESSAGES.HEADER_PROFILE}>
            {user?.avatarUrl || user?.avatar ? (
              <img src={user.avatarUrl || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </button>
        ) : (
          <button type="button" onClick={() => setView(VIEW_KEYS.LOGIN)} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm hover:bg-secondary transition" title={MESSAGES.HEADER_LOGIN}>
            <LogIn size={14} /><span className="hidden sm:inline">{MESSAGES.HEADER_LOGIN}</span>
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background p-4 lg:hidden space-y-3">
          {/* Mobile branch selector */}
          <div className="flex items-center gap-2 rounded-xl border bg-secondary/60 px-3 py-2">
            <MapPin size={14} className="text-primary" />
            <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-transparent text-sm outline-none">
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
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
