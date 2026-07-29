import { useState, useEffect } from "react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";
import { mapDbCartToLegacy, parsePrice, UUID_PATTERN, getCartSessionId } from "../../utils/appUtils";
import { matchSize } from "../../utils/appUtils";
import { getAccessToken } from "../components/authSession";

export function useCartState(user: any, selectedStore: any) {
  const [cart, setCart] = useState<any[]>([]);
  const [cartSessionId] = useState(getCartSessionId);
  const [appliedCoupon, setAppliedCouponState] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem("appliedCoupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setAppliedCoupon = (coupon: any | null) => {
    setAppliedCouponState(coupon);
    try {
      if (coupon) {
        sessionStorage.setItem("appliedCoupon", JSON.stringify(coupon));
      } else {
        sessionStorage.removeItem("appliedCoupon");
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (appliedCoupon && cart.length > 0) {
      const currentSubtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);
      const minOrderVal = Number(appliedCoupon.minOrderValue || 0);
      if (currentSubtotal < minOrderVal) {
        setAppliedCoupon(null);
        toast.error("Voucher đã bị hủy do giỏ hàng không đủ điều kiện.");
        return;
      }
      if (appliedCoupon.productId) {
        const hasProduct = cart.some((item: any) => (item.productId || item.product?.raw?.id) === appliedCoupon.productId);
        if (!hasProduct) {
          setAppliedCoupon(null);
          toast.error("Voucher bị hủy do sản phẩm không còn trong giỏ.");
          return;
        }
      }
      if (appliedCoupon.categoriesId) {
        const hasCategory = cart.some((item: any) => {
          const prod = item.product?.raw;
          if (!prod) return false;
          return prod.categoryId === appliedCoupon.categoriesId || prod.categoriesId === appliedCoupon.categoriesId || prod.category?.id === appliedCoupon.categoriesId;
        });
        if (!hasCategory) {
          setAppliedCoupon(null);
          toast.error("Voucher bị hủy do không còn sản phẩm thuộc danh mục áp dụng.");
          return;
        }
      }
    }
  }, [cart, appliedCoupon]);

  const cartHeaders = (includeJson = false) => {
    const headers: Record<string, string> = { "X-Session-Id": cartSessionId };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (includeJson) headers["Content-Type"] = "application/json";
    return headers;
  };

  const cartUrl = (path = "") => `${env.API_URL}/cart${path}?branchId=${selectedStore.id}`;

  const fetchCart = async (branchId: string, token = getAccessToken()) => {
    if (!UUID_PATTERN.test(branchId)) return;
    try {
      const headers: Record<string, string> = { "X-Session-Id": cartSessionId };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${env.API_URL}/cart?branchId=${branchId}`, { headers });
      if (res.ok) {
        const dbCart = await parseRes(res);
        const legacyCart = mapDbCartToLegacy(dbCart?.items || dbCart?.data?.items || (Array.isArray(dbCart) ? dbCart : []));
        setCart(legacyCart);
      }
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng:", err);
    }
  };

  const handleAddToCart = async (product: any, quantity: number = 1, size: string = "M", note: string = "", extraOptions: any[] = []) => {
    if (!selectedStore) {
      toast.error("Vui lòng chọn cửa hàng trước");
      return;
    }
    const realId = product.raw?.id || product[0];
    const isCombo = !!product.raw?.isCombo;
    let actualPrice = parsePrice(product[1]);
    let finalSize = size;
    let productVariants = product.raw?.variants || product.raw?.productVariants || [];
    if (!productVariants.length && product.raw?.product?.variants) productVariants = product.raw.product.variants;
    if (productVariants.length > 0) {
      const matched = productVariants.find((v: any) => matchSize(v.size, size));
      if (matched) {
        actualPrice = Number(matched.price);
        finalSize = matched.size;
      }
    }

    const payload = {
      productId: isCombo ? null : realId,
      comboId: isCombo ? realId : null,
      variantId: productVariants.length > 0 ? productVariants.find((v: any) => matchSize(v.size, finalSize))?.id : null,
      quantity,
      size: finalSize,
      note,
      extraOptions: extraOptions.map(opt => ({ name: opt.name, price: opt.price }))
    };

    try {
      const res = await fetch(cartUrl("/items"), {
        method: "POST",
        headers: cartHeaders(true),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await parseRes(res);
        throw new Error(errData?.message || "Lỗi thêm vào giỏ");
      }
      toast.success(`Đã thêm ${quantity} ${product[0]} vào giỏ!`);
      await fetchCart(selectedStore.id);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateCartQty = async (index: number, delta: number) => {
    const item = cart[index];
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      handleRemoveCartItem(index);
      return;
    }
    if (item.cartItemId) {
      try {
        const res = await fetch(cartUrl(`/items/${item.cartItemId}`), {
          method: "PATCH",
          headers: cartHeaders(true),
          body: JSON.stringify({ quantity: newQty }),
        });
        if (res.ok) {
          const newCart = [...cart];
          newCart[index].quantity = newQty;
          setCart(newCart);
        } else {
          const errData = await parseRes(res);
          toast.error(errData?.message || "Lỗi cập nhật số lượng");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newCart = [...cart];
      newCart[index].quantity = newQty;
      setCart(newCart);
    }
  };

  const handleRemoveCartItem = async (index: number) => {
    const item = cart[index];
    if (item.cartItemId) {
      try {
        const res = await fetch(cartUrl(`/items/${item.cartItemId}`), {
          method: "DELETE",
          headers: cartHeaders(),
        });
        if (res.ok) {
          setCart(cart.filter((_, i) => i !== index));
          toast.info("Đã xóa sản phẩm khỏi giỏ.");
        } else {
          toast.error("Lỗi xóa sản phẩm");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setCart(cart.filter((_, i) => i !== index));
      toast.info("Đã xóa sản phẩm khỏi giỏ.");
    }
  };

  const subtotal = cart.reduce((s, i) => s + (i.price || parsePrice(i.product[1])) * i.quantity, 0);
  let discount = 0;
  if (user && appliedCoupon) {
    const matchingItems = cart.filter((item: any) => {
      const isProductMatch = !appliedCoupon.productId || (item.productId || item.product?.raw?.id) === appliedCoupon.productId;
      const isCategoryMatch = !appliedCoupon.categoriesId || (
        item.product?.raw?.categoryId === appliedCoupon.categoriesId ||
        item.product?.raw?.categoriesId === appliedCoupon.categoriesId ||
        item.product?.raw?.category?.id === appliedCoupon.categoriesId
      );
      const isSizeMatch = !appliedCoupon.targetSize || matchSize(item.size, appliedCoupon.targetSize);
      return isProductMatch && isCategoryMatch && isSizeMatch;
    });

    const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || parsePrice(item.product[1])) * item.quantity, 0);

    if (matchingItems.length > 0) {
      if (appliedCoupon.discountType === "percent") {
        discount = Math.round(matchingSubtotal * (Number(appliedCoupon.discountValue) / 100));
        if (appliedCoupon.maxDiscount && Number(appliedCoupon.maxDiscount) > 0) {
          discount = Math.min(discount, Number(appliedCoupon.maxDiscount));
        }
      } else {
        discount = Math.min(matchingSubtotal, Number(appliedCoupon.discountValue));
      }
    }
  }

  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  return {
    cart, setCart, cartSessionId, appliedCoupon, setAppliedCoupon,
    fetchCart, cartHeaders, cartUrl,
    handleAddToCart, handleUpdateCartQty, handleRemoveCartItem,
    subtotal, discount, shipping, grandTotal
  };
}
