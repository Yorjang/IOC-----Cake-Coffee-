import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CATEGORY_GROUPS, VIEW_KEYS } from "../../../../config/appConfig";
import { getDiscountedPrice } from "../../../components/shared";

const formatPrice = (priceNum: number): string => {
  return priceNum.toLocaleString("vi-VN") + "đ";
};

interface ComboDrinkOption {
  productName: string;
  sugar: string;
  ice: string;
  toppings?: string[];
}

export function useProductDetail({ product, setView, onAddToCart, wishlist, onToggleWishlist, onSelectProduct, products = [], publicCoupons = [] }: any) {
  const p = product || products[0] || ["Sản phẩm", "0đ", "Khác", "", "5.0", ""];
  const isDrink = p.raw?.productType === "coffee" || p.raw?.productType === "drink" || CATEGORY_GROUPS.DRINKS.includes(p[2] as any);
  const isBirthdayCake = p[2] === "Bánh sinh nhật";
  const isCombo = p.raw?.productType === "combo";
  const availableVariants = useMemo(() => {
    const variants = Array.isArray(p.raw?.variants) ? p.raw.variants : [];
    return variants
      .filter((variant: any) => variant.status === "active")
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  }, [p.raw?.id, p.raw?.variants]);
  const toppingOptions = useMemo(() => {
    const toppings = Array.isArray(p.raw?.toppings) ? p.raw.toppings : [];
    return toppings
      .filter((topping: any) => topping.isActive)
      .sort((a: any, b: any) => Number(a.sortOrder) - Number(b.sortOrder));
  }, [p.raw?.id, p.raw?.toppings]);

  // Form states
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [sugar, setSugar] = useState("100%");
  const [ice, setIce] = useState("100%");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [comboDrinkOptions, setComboDrinkOptions] = useState<Record<string, ComboDrinkOption>>({});
  const [customText, setCustomText] = useState("");
  const [needCandles, setNeedCandles] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedVariantId(current =>
      availableVariants.some((variant: any) => variant.id === current)
        ? current
        : availableVariants[0]?.id || "",
    );
  }, [p.raw?.id, availableVariants]);

  useEffect(() => {
    setSelectedToppings(current => current.filter(name => toppingOptions.some((topping: any) => topping.name === name)));
  }, [p.raw?.id, toppingOptions]);

  useEffect(() => {
    if (!isCombo) {
      setComboDrinkOptions({});
      return;
    }
    const comboItems = Array.isArray(p.raw?.items) ? p.raw.items : [];
    const nextOptions = comboItems.reduce(
      (options: Record<string, ComboDrinkOption>, item: any) => {
        const productType = item.childProduct?.productType?.toLowerCase();
        if (productType === "coffee" || productType === "drink") {
          options[item.id] = {
            productName: item.childProduct?.name ?? "Đồ uống",
            sugar: "100%",
            ice: "100%",
            toppings: [],
          };
        }
        return options;
      },
      {},
    );
    setComboDrinkOptions(nextOptions);
  }, [isCombo, p.raw?.id, p.raw?.items]);

  const selectedVariant = availableVariants.find((variant: any) => variant.id === selectedVariantId)
    || availableVariants[0];

  const isWishlisted = wishlist.some((w: any) => w[0] === p[0]);

  // Related products
  const related = products
    .filter((item: any) => item[2] === p[2] && item[0] !== p[0])
    .slice(0, 4);

  const comboToppingsPrice = useMemo(() => {
    if (!isCombo) return 0;
    let sum = 0;
    const comboItems = Array.isArray(p.raw?.items) ? p.raw.items : [];
    for (const item of comboItems) {
      const option = comboDrinkOptions[item.id];
      if (option && option.toppings && option.toppings.length > 0) {
        const itemToppings = Array.isArray(item.childProduct?.toppings) ? item.childProduct.toppings : [];
        for (const tName of option.toppings) {
          const t = itemToppings.find((x: any) => x.name === tName);
          if (t) {
            sum += Number(t.price || 0) * Number(item.quantity || 1);
          }
        }
      }
    }
    return sum;
  }, [isCombo, comboDrinkOptions, p.raw?.items]);

  const toppingsPrice = selectedToppings.reduce((sum: number, name: string) => {
    const option = toppingOptions.find((topping: any) => topping.name === name);
    return sum + Number(option?.price || 0);
  }, 0);

  const variantPrice = Number(selectedVariant?.price || 0);
  const unitPrice = Math.max(0, variantPrice + toppingsPrice + comboToppingsPrice);
  const selectedSize = selectedVariant?.size || selectedVariant?.variantName || "";
  const { discountedPrice: discountedVariantPrice, discountAmount, bestCoupon } = getDiscountedPrice(variantPrice, p.raw, publicCoupons, selectedSize);
  const discountedPrice = discountedVariantPrice + toppingsPrice + comboToppingsPrice;
  const totalPriceStr = formatPrice(discountedPrice * quantity);

  const toggleTopping = (name: string) => {
    setSelectedToppings(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const updateComboDrinkOption = (
    itemId: string,
    field: keyof ComboDrinkOption,
    value: string,
  ) => {
    setComboDrinkOptions(current => ({
      ...current,
      [itemId]: {
        productName: current[itemId]?.productName ?? "Đồ uống",
        sugar: current[itemId]?.sugar ?? "100%",
        ice: current[itemId]?.ice ?? "100%",
        toppings: current[itemId]?.toppings ?? [],
        [field]: value,
      },
    }));
  };

  const toggleComboDrinkTopping = (itemId: string, toppingName: string) => {
    setComboDrinkOptions(current => {
      const existing = current[itemId];
      if (!existing) return current;
      const currentToppings = existing.toppings || [];
      const newToppings = currentToppings.includes(toppingName)
        ? currentToppings.filter(t => t !== toppingName)
        : [...currentToppings, toppingName];
      return {
        ...current,
        [itemId]: {
          ...existing,
          toppings: newToppings,
        },
      };
    });
  };

  const handleAdd = (buyNow = false) => {
    if (!selectedVariant) {
      toast.error("Sản phẩm hiện chưa có kích cỡ khả dụng.");
      return;
    }
    const options = {
      sugar: isDrink ? sugar : undefined,
      ice: isDrink ? ice : undefined,
      toppings: isDrink && selectedToppings.length > 0 ? selectedToppings : undefined,
      comboDrinkOptions: isCombo ? comboDrinkOptions : undefined,
      customText: isBirthdayCake && customText.trim() ? customText : undefined,
      needCandles: isBirthdayCake && needCandles ? true : undefined,
    };
    onAddToCart(
      p,
      selectedVariant.size || selectedVariant.variantName,
      quantity,
      options,
      unitPrice,
      selectedVariant.id,
    );
    if (buyNow) {
      setView(VIEW_KEYS.CART);
    } else {
      toast.success(`Đã thêm ${quantity} x ${p[0]} vào giỏ hàng!`);
    }
  };


  return {
    p, isDrink, isBirthdayCake,
    availableVariants, toppingOptions,
    selectedVariantId, setSelectedVariantId,
    sugar, setSugar,
    ice, setIce,
    selectedToppings, setSelectedToppings,
    comboDrinkOptions,
    customText, setCustomText,
    needCandles, setNeedCandles,
    quantity, setQuantity,
    selectedVariant, isWishlisted,
    related,
    toppingsPrice, variantPrice, unitPrice,
    selectedSize, discountedPrice, discountAmount, bestCoupon, totalPriceStr,
    toggleTopping, updateComboDrinkOption, toggleComboDrinkTopping, handleAdd
  };
}
