import { useState } from "react";
import { CakeSlice, Heart, LogIn, MapPin, Menu, Search, ShoppingBag, User } from "lucide-react";
import { MESSAGES } from "../../constants/messages";
import { VIEW_KEYS } from "../../config/appConfig";

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
  user,
  products = [],
  selectedStore,
  onChooseStore,
}: any) {
  const [mobileOpen, setMobileOpen] = useState(false);
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
        <button type="button" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          <Menu />
        </button>

        <button type="button" onClick={() => setView(VIEW_KEYS.HOME)} className="flex shrink-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <CakeSlice size={18} />
          </span>
          <span className="hidden font-serif text-xl font-bold sm:block">Sweet Bean</span>
        </button>

        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {navPages?.map((v: string) => (
            <button
              type="button"
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-2 text-sm transition ${
                view === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {v}
            </button>
          ))}
        </nav>

        <div className="hidden lg:block">
          <button
            type="button"
            onClick={onChooseStore}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
            title="Chọn cửa hàng"
          >
            <MapPin size={12} className="shrink-0 text-primary" />
            <span className="max-w-[150px] truncate">{selectedStore?.name ?? "Chọn cửa hàng"}</span>
          </button>
        </div>

        <div className="relative hidden w-64 items-center gap-2 rounded-full border bg-card px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 md:flex">
          <Search size={16} className="shrink-0 text-muted-foreground" />
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
            className="w-full border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-0"
          />

          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border bg-card p-2 shadow-lg animate-fadeIn">
              {suggestions.map((p: any) => (
                <button
                  key={p[0]}
                  type="button"
                  onClick={() => {
                    setView(VIEW_KEYS.DETAIL, p);
                    onSearchChange?.("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-secondary"
                >
                  <img src={p[3]} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-xs font-semibold text-foreground">{p[0]}</div>
                    <div className="text-[10px] text-muted-foreground">{p[2]}</div>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-primary">{p[1]}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.FAVORITES)}
          className={`relative rounded-full p-2 transition ${
            view === VIEW_KEYS.FAVORITES ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          }`}
          title={MESSAGES.HEADER_FAVORITE}
        >
          <Heart size={20} className={view === VIEW_KEYS.FAVORITES ? "fill-current" : ""} />
          {wishlistCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {wishlistCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.CART)}
          className={`relative rounded-full p-2 transition ${
            view === VIEW_KEYS.CART ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          }`}
          title={MESSAGES.HEADER_CART}
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartCount}
            </span>
          )}
        </button>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setView(VIEW_KEYS.PROFILE)}
            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full border transition ${
              view === VIEW_KEYS.PROFILE
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary hover:bg-accent"
            }`}
            title={MESSAGES.HEADER_PROFILE}
          >
            {user?.avatarUrl || user?.avatar ? (
              <img src={user.avatarUrl || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setView(VIEW_KEYS.LOGIN)}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm transition hover:bg-secondary"
            title={MESSAGES.HEADER_LOGIN}
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">{MESSAGES.HEADER_LOGIN}</span>
          </button>
        )}
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-t bg-background p-4 lg:hidden">
          <button
            type="button"
            onClick={() => {
              onChooseStore?.();
              setMobileOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl border bg-secondary/60 px-3 py-2 text-left"
          >
            <MapPin size={14} className="text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm">{selectedStore?.name ?? "Chọn cửa hàng"}</span>
          </button>
          <nav className="grid grid-cols-2 gap-2">
            {navPages?.map((v: string) => (
              <button
                type="button"
                key={v}
                onClick={() => {
                  setView(v);
                  setMobileOpen(false);
                }}
                className={`rounded-xl p-2.5 text-left text-sm transition ${
                  view === v ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"
                }`}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
