import { ProductCard } from "../components/shared";
import { VIEW_KEYS } from "../../config/appConfig";

export function Favorites({ wishlist, onToggleWishlist, onAddToCart, onSelectProduct, setView }: any) {
  return (
    <div className="w-full px-2 py-8 sm:px-4 lg:px-4">
      <h2 className="mb-6 text-2xl md:text-3xl font-bold font-serif">Sản phẩm yêu thích</h2>
      {wishlist.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishlist.map((p: any) => (
            <ProductCard
              key={p[0]}
              p={p}
              onSelect={onSelectProduct}
              isWishlisted={true}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground border border-dashed rounded-3xl">
          Danh sách yêu thích của bạn trống.
          <button onClick={() => setView(VIEW_KEYS.HOME)} className="mt-4 block mx-auto text-primary underline font-medium">
            Khám phá sản phẩm
          </button>
        </div>
      )}
    </div>
  );
}
