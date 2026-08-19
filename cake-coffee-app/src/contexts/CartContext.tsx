import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/apiClient';

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: 'S' | 'M' | 'L';
  sugar: string; // e.g. "100%", "50%"
  ice: string;   // e.g. "100%", "50%"
  toppings: string[];
  quantity: number;
  note?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
}

interface CartContextType {
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  shippingFee: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setShippingFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  appliedCoupon: null,
  shippingFee: 15000,
  subtotal: 0,
  discount: 0,
  grandTotal: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  applyCoupon: async () => false,
  removeCoupon: () => {},
  setShippingFee: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [customShippingFee, setCustomShippingFee] = useState<number | null>(null);
  const shippingFee = cart.length > 0 ? (customShippingFee !== null ? customShippingFee : 15000) : 0;

  useEffect(() => {
    loadSavedCart();
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const loadSavedCart = async () => {
    try {
      const saved = await AsyncStorage.getItem('mobile_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {}
  };

  const saveCart = async (currentCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem('mobile_cart', JSON.stringify(currentCart));
    } catch (e) {}
  };

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      // Find matching item with same specs
      const existingIndex = prevCart.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.size === newItem.size &&
          i.sugar === newItem.sugar &&
          i.ice === newItem.ice &&
          JSON.stringify(i.toppings.sort()) === JSON.stringify(newItem.toppings.sort())
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      } else {
        const itemWithId: CartItem = {
          ...newItem,
          id: `${newItem.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        return [...prevCart, itemWithId];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCustomShippingFee(null);
  };

  const applyCoupon = async (couponOrCode: string | Coupon): Promise<boolean> => {
    if (typeof couponOrCode === 'object' && couponOrCode.code) {
      setAppliedCoupon(couponOrCode);
      return true;
    }

    const cleanCode = (couponOrCode as string).trim().toUpperCase();
    if (!cleanCode) return false;

    try {
      const res = await apiFetch('/coupons/public');
      if (Array.isArray(res)) {
        const found = res.find((c: any) => c.code.toUpperCase() === cleanCode);
        if (found) {
          const type = found.discountType === 'percent' || found.discountType === 'percentage' ? 'percentage' : 'fixed';
          setAppliedCoupon({
            code: found.code,
            discountType: type,
            discountValue: Number(found.discountValue || 0),
            minOrderValue: Number(found.minOrderValue || 0),
          });
          return true;
        }
      }
    } catch (e) {}

    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discount = appliedCoupon.discountValue;
    }
  }

  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  return (
    <CartContext.Provider
      value={{
        cart,
        appliedCoupon,
        shippingFee,
        subtotal,
        discount,
        grandTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        setShippingFee: setCustomShippingFee,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
