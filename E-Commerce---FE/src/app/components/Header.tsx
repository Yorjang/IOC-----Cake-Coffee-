import { useState } from "react";
import { CakeSlice, ChevronDown, Heart, LogIn, LogOut, MapPin, Menu, Search, Settings, ShoppingBag, User, Package } from "lucide-react";
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
  onLogout,
  lastCreatedOrder,
}: any) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const showSuggestions = isFocused && searchQuery.trim().length > 0;
  const suggestions = showSuggestions
    ? products
      .filter((p: any) => p[0].toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="w-full flex items-center gap-3 px-2 sm:px-4 lg:px-4 py-3">
        <button type="button" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          <Menu />
        </button>

        {/* Desktop Nav Dropdown */}
        <div className="hidden lg:block relative group mr-1">
          <button className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary rounded-full">
            <Menu size={22} strokeWidth={2.5} />
          </button>
          <div className="absolute top-full left-0 pt-1 w-48 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="rounded-xl bg-card border shadow-lg overflow-hidden py-1">
              {navPages?.flatMap((v: string) => v === "Trang chủ" ? [] : [
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${view === v ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"
                    }`}
                >
                  {v}
                </button>
              ])}
            </div>
          </div>
        </div>

        {/* Logo */}
        <button type="button" onClick={() => setView(VIEW_KEYS.HOME)} className="flex shrink-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <CakeSlice size={18} />
          </span>
          <span className="hidden font-serif text-xl font-bold sm:block">Sweet Bean</span>
        </button>

        {/* Search (Moved to left) */}
        {(() => {
          const isSearchExpanded = isFocused || searchQuery.trim().length > 0;
          return (
            <div
              className={`group relative hidden md:flex items-center rounded-full border bg-card transition-all duration-300 ease-in-out overflow-hidden h-[36px] ml-3 ${isSearchExpanded ? 'w-64 ring-2 ring-primary/40' : 'w-[36px] hover:w-64'
                }`}
            >
              <div className="absolute left-0 top-0 flex h-full w-[36px] items-center justify-center text-muted-foreground pointer-events-none">
                <Search size={16} />
              </div>
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
                className={`w-full h-full pl-[36px] pr-4 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 transition-opacity duration-300 ${isSearchExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
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
          );
        })()}

        {/* Spacer to push everything else to the right */}
        <div className="flex-1" />

        <div className="hidden lg:block mr-2">
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

        {(isLoggedIn || lastCreatedOrder) && (
          <button
            type="button"
            onClick={() => setView(VIEW_KEYS.TRACKING)}
            className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.TRACKING ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            title="Theo dõi đơn hàng"
          >
            <Package size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setView(VIEW_KEYS.CART)}
          className={`relative rounded-full p-2 transition ${view === VIEW_KEYS.CART ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
              className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-border bg-secondary hover:bg-accent transition group"
              title={MESSAGES.HEADER_PROFILE}
            >
              <div className="h-full w-full flex items-center justify-center overflow-hidden rounded-full">
                {user?.avatarUrl || user?.avatar ? (
                  <img src={user.avatarUrl || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full border-[1.5px] border-background bg-secondary text-foreground shadow-sm transition-colors group-hover:bg-accent">
                <ChevronDown size={10} strokeWidth={3} />
              </div>
            </button>
            <div className={`absolute top-full right-0 mt-2 w-40 z-50 transition-all duration-200 ${profileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              <div className="rounded-xl bg-card border shadow-lg overflow-hidden py-1">
                <button
                  onClick={() => {
                    setView(VIEW_KEYS.FAVORITES);
                    setProfileOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-muted-foreground" />
                    Yêu thích
                  </div>
                  {wishlistCount > 0 && (
                    <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground font-semibold">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setView(VIEW_KEYS.PROFILE);
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <Settings size={16} className="text-muted-foreground" />
                  Cài đặt
                </button>
                <div className="h-px bg-border mx-2 my-1" />
                <button
                  onClick={() => {
                    onLogout?.();
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
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
                className={`rounded-xl p-2.5 text-left text-sm transition ${view === v ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"
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
