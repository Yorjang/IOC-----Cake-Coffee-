import { useState, useEffect } from "react";
import { ProductCard } from "../components/shared";
import { CATEGORY_GROUPS, VIEW_KEYS } from "../../config/appConfig";
import { SlidersHorizontal } from "lucide-react";

// Helper utilities for prices
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
};

export function ProductListing({ category, setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist, searchQuery, products: rawProducts = [] }: any) {
  const products = Array.isArray(rawProducts) ? rawProducts : (Array.isArray(rawProducts?.data) ? rawProducts.data : []);
  // Filter States
  const [selectedSubCat, setSelectedSubCat] = useState<string>("Tất cả");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("Tất cả");
  const [sortBy, setSortBy] = useState<string>("default");

  // Reset filters when main category changes
  useEffect(() => {
    setSelectedSubCat("Tất cả");
    setSelectedPriceRange("Tất cả");
    setSortBy("default");
  }, [category]);

  // 1. Base list filtered by Main Category
  let baseList: any[] = [];
  if (category === "Tìm kiếm") {
    baseList = products.filter(p => p[0].toLowerCase().includes(searchQuery.toLowerCase()));
  } else if (category === VIEW_KEYS.DRINKS) {
    baseList = products.filter(p => p.raw?.productType === "coffee" || p.raw?.productType === "drink");
  } else if (category === VIEW_KEYS.SWEETS) {
    baseList = products.filter(p => p.raw?.productType === "cake");
  } else if (category === VIEW_KEYS.COMBO) {
    baseList = products.filter(p => p.raw?.productType === "combo");
  } else if (category === VIEW_KEYS.ALL_PRODUCTS) {
    baseList = products.filter(p => p.raw?.productType !== "combo");
  } else {
    baseList = products.filter(p => p[2] === category);
  }

  // 2. Determine subcategories to show in sidebar dynamically
  let subCategories: string[] = [];
  if (category === VIEW_KEYS.DRINKS) {
    const drinkCats = products
      .filter((p: any) => p.raw?.productType === "coffee" || p.raw?.productType === "drink")
      .map((p: any) => p[2] as string);
    subCategories = Array.from(new Set(drinkCats));
  } else if (category === VIEW_KEYS.SWEETS) {
    const sweetCats = products
      .filter((p: any) => p.raw?.productType === "cake")
      .map((p: any) => p[2] as string);
    subCategories = Array.from(new Set(sweetCats));
  } else if (category === "Tìm kiếm") {
    const searchCats = baseList.map((p: any) => p[2] as string);
    subCategories = Array.from(new Set(searchCats));
  } else if (category === VIEW_KEYS.ALL_PRODUCTS) {
    const allCats = products
      .filter((p: any) => p.raw?.productType !== "combo")
      .map((p: any) => p[2] as string);
    subCategories = Array.from(new Set(allCats));
  }

  // 2. Apply Sub-category filter
  let filtered = baseList;
  if (selectedSubCat !== "Tất cả") {
    filtered = filtered.filter(p => p[2] === selectedSubCat);
  }

  // 3. Apply Price Range filter
  if (selectedPriceRange !== "Tất cả") {
    filtered = filtered.filter(p => {
      const price = parsePrice(p[1]);
      if (selectedPriceRange === "under-50k") return price < 50000;
      if (selectedPriceRange === "50k-100k") return price >= 50000 && price <= 100000;
      if (selectedPriceRange === "over-100k") return price > 100000;
      return true;
    });
  }

  // 4. Apply Sorting
  const sorted = [...filtered];
  if (sortBy === "price-asc") {
    sorted.sort((a, b) => parsePrice(a[1]) - parsePrice(b[1]));
  } else if (sortBy === "price-desc") {
    sorted.sort((a, b) => parsePrice(b[1]) - parsePrice(a[1]));
  } else if (sortBy === "rating-desc") {
    sorted.sort((a, b) => parseFloat(b[4]) - parseFloat(a[4]));
  }

  return (
    <div className="w-full px-2 sm:px-4 lg:px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Left Side: Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Header title */}
          <div className="flex items-center gap-2 border-b pb-4">
            <SlidersHorizontal size={18} className="text-primary" />
            <h3 className="font-bold text-lg font-serif text-foreground">Bộ lọc tìm kiếm</h3>
          </div>

          {/* Subcategories list */}
          {subCategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Phân loại món</h4>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubCat("Tất cả")}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    selectedSubCat === "Tất cả"
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  Tất cả
                </button>
                {subCategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubCat(sub)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      selectedSubCat === sub
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range list */}
          <div className="space-y-3 border-t pt-5">
            <h4 className="font-semibold text-sm text-foreground">Khoảng giá</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { id: "Tất cả", label: "Tất cả" },
                { id: "under-50k", label: "Dưới 50.000đ" },
                { id: "50k-100k", label: "50.000đ - 100.000đ" },
                { id: "over-100k", label: "Trên 100.000đ" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(opt.id)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    selectedPriceRange === opt.id
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Products Grid */}
        <div className="lg:col-span-3">
          {/* Top header of product list */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
                {category === "Tìm kiếm" ? `Kết quả cho "${searchQuery}"` : category}
              </h2>
              <span className="text-xs text-muted-foreground font-medium mt-1 block">
                Tìm thấy {sorted.length} sản phẩm phù hợp
              </span>
            </div>

            {/* Sorters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary text-foreground cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="rating-desc">Đánh giá: Cao nhất</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {sorted.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {sorted.map(p => (
                <ProductCard
                  key={p[0]}
                  p={p}
                  onSelect={onSelectProduct}
                  isWishlisted={wishlist.some((w: any) => w[0] === p[0])}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-muted-foreground border border-dashed rounded-3xl">
              <p className="text-sm">Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubCat("Tất cả");
                  setSelectedPriceRange("Tất cả");
                  setSortBy("default");
                }}
                className="mt-4 inline-block text-primary underline text-sm font-semibold hover:text-primary/80 transition"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

