import { Heart, LogOut, MapPin, Search, Settings, ShoppingBag, User, X, ChevronDown, Smartphone, PackageSearch } from "lucide-react";
import { useState } from "react";
import { VIEW_KEYS } from "../../config/appConfig";
import { HeaderNotifications } from "./HeaderNotifications";

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
  onOpenDownloadModal,
}: any) {
  const [showFilters, setShowFilters] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Use navPages as categories
  const categories = navPages || [];

  return (
    <header className="sticky top-0 z-40 bg-background/97 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center">
          <div className={`group relative flex items-center h-10 ${searchQuery ? 'w-[250px] border-gray-400' : 'w-[22px] border-transparent'} hover:w-[250px] focus-within:w-[250px] transition-all duration-500 ease-in-out border-b hover:border-gray-400 focus-within:border-gray-400 overflow-hidden`}>
            <input
              type="text"
              placeholder="Bạn cần tìm gì...?"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit?.();
                }
              }}
              className={`absolute left-0 top-0 h-full w-[250px] pr-8 pl-0 text-[13px] bg-transparent focus:outline-none transition-opacity duration-300 ${searchQuery ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'} placeholder:text-gray-500`}
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  onSearchChange?.("");
                  setView(VIEW_KEYS.HOME);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            ) : (
              <Search size={22} strokeWidth={1.5} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none z-10" />
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="flex-1 flex justify-center">
          <button type="button" onClick={() => setView(VIEW_KEYS.HOME)} className="flex-shrink-0">
            <div style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-[24px] font-bold tracking-wide uppercase">
              Sweet Bean
            </div>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex-1 flex items-center justify-end gap-5">
          {isLoggedIn ? (
            <div className="relative order-last">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
                className="relative flex items-center justify-center hover:opacity-70 transition"
              >
                {user?.avatarUrl || user?.avatar ? (
                  <img src={user.avatarUrl || user.avatar} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User size={22} strokeWidth={1.5} className="text-gray-700" />
                )}
              </button>
              <div className={`absolute top-full right-0 mt-2 w-40 z-50 transition-all duration-200 ${profileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <div className="rounded-xl bg-card border shadow-lg overflow-hidden py-1">
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
              onClick={() => setView(VIEW_KEYS.LOGIN)}
              className="flex items-center hover:opacity-70 transition-opacity order-last"
            >
              <User size={22} strokeWidth={1.5} className="text-gray-700" />
            </button>
          )}

          {isLoggedIn && <HeaderNotifications setView={setView} user={user} />}

          <button
            onClick={() => setView(VIEW_KEYS.FAVORITES)}
            className="flex items-center hover:opacity-70 transition-opacity relative"
          >
            <Heart size={22} strokeWidth={1.5} className="text-gray-700" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-background">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setView(VIEW_KEYS.TRACKING)}
            className="flex items-center hover:opacity-70 transition-opacity"
            title="Theo dõi đơn hàng"
            aria-label="Theo dõi đơn hàng"
          >
            <PackageSearch size={22} strokeWidth={1.5} className="text-gray-700" />
          </button>

          <button
            onClick={() => setView(VIEW_KEYS.CART)}
            className="flex items-center hover:opacity-70 transition-opacity relative"
          >
            <ShoppingBag size={22} strokeWidth={1.5} className="text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-accent text-foreground text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-background">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-t border-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-1">
          {/* Desktop Categories */}
          <div className="hidden md:flex items-center gap-1">
            {categories.map((cat: string) => {
              const isActive = view === cat || (view === VIEW_KEYS.HOME && cat === categories[0]);
              return (
                <button
                  key={cat}
                  onClick={() => setView(cat)}
                  className={`flex-shrink-0 px-4 py-3 text-[11px] tracking-[0.2em] uppercase font-medium border-b-2 transition-colors ${isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Mobile Categories Dropdown */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-1.5 px-2 py-3 text-[11px] tracking-[0.2em] uppercase font-medium text-foreground transition-colors"
            >
              DANH MỤC <ChevronDown size={14} className={`transition-transform duration-200 ${showMobileMenu ? "rotate-180" : ""}`} />
            </button>

            <div className={`absolute top-full left-4 sm:left-6 mt-1 w-56 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 transition-all duration-200 origin-top ${showMobileMenu ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}>
              <div className="py-1">
                {categories.map((cat: string) => {
                  const isActive = view === cat || (view === VIEW_KEYS.HOME && cat === categories[0]);
                  return (
                    <button
                      key={cat}
                      onClick={() => { setView(cat); setShowMobileMenu(false); }}
                      className={`block w-full text-left px-4 py-3 text-[11px] tracking-[0.2em] uppercase font-medium transition-colors ${isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3 flex-shrink-0">
            {onOpenDownloadModal && (
              <button
                type="button"
                onClick={onOpenDownloadModal}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-[#D84315] hover:bg-[#BF360C] text-white text-[11px] font-bold rounded-full shadow-md transition-all hover:scale-105 border border-white/20"
                title="Tải ngay ứng dụng Sweet Bean"
              >
                <Smartphone size={13} className="animate-pulse text-amber-200" />
                <span className="tracking-wide">Tải ngay ứng dụng Sweet Bean</span>
              </button>
            )}

            <button
              onClick={onChooseStore}
              className="flex items-center gap-1.5 py-3 pl-1 text-[12px] font-medium text-foreground/80 hover:text-foreground transition-colors"
              title="Xem danh sách cửa hàng"
            >
              <MapPin size={14} strokeWidth={2} />
              <span className="hidden sm:inline tracking-wide">{selectedStore?.name ?? "Xem cửa hàng"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
