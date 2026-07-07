import { products } from "../../data/mockData";
import { ProductCard } from "../components/shared";
import { CATEGORY_GROUPS, VIEW_KEYS } from "../../config/appConfig";

export function ProductListing({ category, setView, onSelectProduct, onAddToCart, wishlist, onToggleWishlist, searchQuery }: any) {
  let filtered: any[] = [];
  if (category === "Tìm kiếm") {
    filtered = products.filter(p => p[0].toLowerCase().includes(searchQuery.toLowerCase()));
  } else if (category === VIEW_KEYS.DRINKS) {
    filtered = products.filter(p => CATEGORY_GROUPS.DRINKS.includes(p[2] as any));
  } else if (category === VIEW_KEYS.SWEETS) {
    filtered = products.filter(p => !CATEGORY_GROUPS.DRINKS.includes(p[2] as any) && p[2] !== "Combo");
  } else if (category === VIEW_KEYS.COMBO) {
    filtered = products.filter(p => p[2] === "Combo");
  } else {
    filtered = products.filter(p => p[2] === category);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold font-serif">
          {category === "Tìm kiếm" ? `Kết quả tìm kiếm cho "${searchQuery}"` : category}
        </h2>
        <span className="text-sm text-muted-foreground">{filtered.length} sản phẩm</span>
      </div>
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(p => (
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
        <div className="py-20 text-center text-muted-foreground border border-dashed rounded-3xl">
          Không tìm thấy sản phẩm nào phù hợp.
          <button onClick={() => setView(VIEW_KEYS.HOME)} className="mt-4 block mx-auto text-primary underline">
            Quay lại trang chủ
          </button>
        </div>
      )}
    </div>
  );
}
