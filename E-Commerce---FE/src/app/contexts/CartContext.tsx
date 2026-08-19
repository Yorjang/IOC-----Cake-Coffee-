import React, { createContext, useContext, useEffect, useState } from 'react';
import { env } from '../../config/env';
import { getAccessToken } from '../components/authSession';

interface CartContextType {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  cartSessionId: string;
  addToCart: (product: any, size?: string, qty?: number, options?: any, price?: number, selectedVariantId?: string) => Promise<void>;
  updateCartItem: (dbId: string, quantity: number, note?: string) => Promise<void>;
  removeCartItem: (dbId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_SESSION_KEY = "sb_cart_session_id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getCartSessionId = () => {
  const existing = localStorage.getItem(CART_SESSION_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
};

// Helper to standardise parsing responses from the new BE format
const parseResponse = async (res: Response) => {
  if (res.status === 204) return null;
  return await parseRes(res);
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [cartSessionId] = useState(getCartSessionId);

  const refreshCart = async () => {
    try {
      const token = getAccessToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-session-id"] = cartSessionId;

      const res = await fetch(`${env.API_URL}/cart`, { headers });
      if (res.ok) {
        const data = await parseResponse(res);
        // Map db items to legacy format
        const legacyCart = (data.items || []).map((item: any) => {
          const p = item.product;
          if (!p) return null;
          const variantPrice = item.variant?.price || 0;
          const formattedPrice = `${Number(variantPrice).toLocaleString("vi-VN")}đ`;
          const categoryName = p.category?.name ?? "Khác";
          const imageUrl = p.imageUrl || "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=520&fit=crop&auto=format";
          const badge = p.productType === "combo" ? "Combo" : (p.variants?.length > 1 ? "S/M/L" : "Còn hàng");
          const ratingVal = p.averageRating !== undefined && p.averageRating !== null ? p.averageRating : p.rating;
          const rating = ratingVal ? String(Number(ratingVal).toFixed(1)) : "5.0";
          
          const legacyProduct = [p.name, formattedPrice, categoryName, imageUrl, rating, badge];
          (legacyProduct as any).raw = p;
          
          let options = {};
          try {
            options = item.note ? JSON.parse(item.note) : {};
          } catch {
            options = { customText: item.note };
          }
          return {
            dbId: item.id,
            product: legacyProduct,
            size: item.variant?.size || "Vừa",
            quantity: item.quantity,
            options,
            price: Number(variantPrice),
            productId: item.productId,
            variantId: item.variantId
          };
        }).filter(Boolean);
        setCart(legacyCart);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  const addToCart = async (product: any, size = "Vừa", qty = 1, options?: any, price?: number, selectedVariantId?: string) => {
    try {
      const raw = product.raw;
      if (!raw) {
        console.error("Missing raw product data", product);
        return;
      }
      const token = getAccessToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-session-id"] = cartSessionId;

      let variantId = selectedVariantId;
      if (!variantId && raw.variants?.length > 0) {
        const v = raw.variants.find((v: any) => v.size === size);
        if (v) variantId = v.id;
        else variantId = raw.variants[0].id;
      }

      const res = await fetch(`${env.API_URL}/cart/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: raw.id,
          variantId,
          quantity: qty,
          note: options ? JSON.stringify(options) : "",
        }),
      });

      if (res.ok) {
        await refreshCart();
      } else {
        const errData = await parseRes(res);
        throw new Error(errData.message || "Failed to add to cart");
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const updateCartItem = async (dbId: string, quantity: number, note?: string) => {
    try {
      const token = getAccessToken();
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-session-id"] = cartSessionId;

      const res = await fetch(`${env.API_URL}/cart/items/${dbId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ quantity, note }),
      });
      if (res.ok) {
        await refreshCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeCartItem = async (dbId: string) => {
    try {
      const token = getAccessToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-session-id"] = cartSessionId;

      const res = await fetch(`${env.API_URL}/cart/items/${dbId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        await refreshCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ cart, setCart, cartSessionId, addToCart, updateCartItem, removeCartItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
