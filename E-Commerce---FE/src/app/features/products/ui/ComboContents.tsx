import { Check } from "lucide-react";

interface ComboProduct {
  name: string;
  productType?: string;
  category?: {
    name?: string;
    slug?: string;
  } | null;
  toppings?: any[];
}

interface ComboVariant {
  variantName: string;
  size?: string | null;
}

export interface ComboContentItem {
  id: string;
  quantity: number;
  sortOrder?: number;
  childProduct?: ComboProduct | null;
  childVariant?: ComboVariant | null;
}

export interface ComboDrinkOption {
  sugar: string;
  ice: string;
  toppings?: string[];
}

interface ComboContentsProps {
  items: ComboContentItem[];
  drinkOptions: Record<string, ComboDrinkOption>;
  sugarOptions: string[];
  iceOptions: string[];
  onDrinkOptionChange: (
    itemId: string,
    field: keyof ComboDrinkOption,
    value: string,
  ) => void;
  onComboDrinkToppingToggle?: (itemId: string, toppingName: string) => void;
}

function isDrinkItem(item: ComboContentItem): boolean {
  const productType = item.childProduct?.productType?.toLowerCase();
  const categorySlug = item.childProduct?.category?.slug?.toLowerCase();
  const categoryName = item.childProduct?.category?.name?.toLowerCase();
  return productType === "coffee"
    || productType === "drink"
    || categorySlug === "cafe"
    || categorySlug === "do-uong"
    || categoryName === "cafe"
    || categoryName === "đồ uống";
}

export function ComboContents({
  items,
  drinkOptions,
  sugarOptions,
  iceOptions,
  onDrinkOptionChange,
  onComboDrinkToppingToggle,
}: ComboContentsProps) {
  const sortedItems = [...items].sort(
    (first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
  );

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm text-foreground">Sản phẩm trong combo</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Combo bao gồm các sản phẩm, biến thể và số lượng sau.
        </p>
      </div>

      {sortedItems.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          {sortedItems.map((item) => {
            const option = drinkOptions[item.id] ?? { sugar: "100%", ice: "100%", toppings: [] };
            return (
              <div key={item.id} className="border-b border-border p-4 last:border-b-0 animate-fadeIn">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.childProduct?.name ?? "Sản phẩm không còn khả dụng"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.childVariant?.variantName
                      ?? item.childVariant?.size
                      ?? "Biến thể mặc định"}
                  </p>
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    ×{item.quantity}
                  </span>
                </div>

                {isDrinkItem(item) && (
                  <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                      Chọn mức đường
                      <select
                        value={option.sugar}
                        onChange={(event) => onDrinkOptionChange(item.id, "sugar", event.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary transition"
                      >
                        {sugarOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                      Chọn mức đá
                      <select
                        value={option.ice}
                        onChange={(event) => onDrinkOptionChange(item.id, "ice", event.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary transition"
                      >
                        {iceOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                  </div>
                )}

                {item.childProduct?.toppings && item.childProduct.toppings.filter((t: any) => t.isActive).length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-foreground mb-2">Thêm Topping</p>
                    <div className="flex flex-wrap gap-2">
                      {item.childProduct.toppings
                        .filter((t: any) => t.isActive)
                        .map((t: any) => {
                          const isSelected = (option.toppings || []).includes(t.name);
                          return (
                            <button
                              key={t.id || t.name}
                              type="button"
                              onClick={() => onComboDrinkToppingToggle?.(item.id, t.name)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition ${
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary font-semibold"
                                  : "border-border hover:border-primary/50 text-foreground"
                              }`}
                            >
                              {isSelected && <Check size={12} />}
                              <span>{t.name}</span>
                              <span className="opacity-75">({t.price.toLocaleString("vi-VN")}đ)</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          Combo hiện chưa có sản phẩm thành phần.
        </p>
      )}
    </div>
  );
}

