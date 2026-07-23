import { create } from 'zustand';
import { CartService } from '../../services/cart.service';
import { toast } from 'sonner';
import { env } from '../../config/env';
import { getAccessToken } from '../components/authSession';
import { useAuthStore } from './useAuthStore';
import { matchSize } from '../../utils/mappers';

const CART_SESSION_KEY = "sb_cart_session_id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getCartSessionId = () => {
  const existing = localStorage.getItem(CART_SESSION_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
};

interface CartState {
  cart: any[];
  cartSessionId: string;
  appliedCoupon: any | null;
  setCart: (cart: any[] | ((prev: any[]) => any[])) => void;
  setAppliedCoupon: (coupon: any | null) => void;
  
  // Actions
  fetchCart: (branchId: string, token: string | null) => Promise<void>;
  handleAddToCart: (product: any, size?: string, quantity?: number, selectedStoreId?: string) => Promise<void>;
  handleUpdateCartQty: (index: number, newQty: number, selectedStoreId?: string) => Promise<void>;
  handleRemoveCartItem: (index: number, selectedStoreId?: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  cartSessionId: getCartSessionId(),
  appliedCoupon: (() => {
    try {
      const saved = sessionStorage.getItem("appliedCoupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  
  setCart: (updater) => set((state) => ({ cart: typeof updater === 'function' ? updater(state.cart) : updater })),
  
  setAppliedCoupon: (coupon) => {
    set({ appliedCoupon: coupon });
    try {
      if (coupon) {
        sessionStorage.setItem("appliedCoupon", JSON.stringify(coupon));
      } else {
        sessionStorage.removeItem("appliedCoupon");
      }
    } catch {}
  },
  
  fetchCart: async (branchId, token) => {
    if (!UUID_PATTERN.test(branchId)) return;
    try {
      // Implement fetch mapping
    } catch (err) {}
  },

  handleAddToCart: async (product: any, size = "Vừa", quantity = 1, selectedStoreId?: string) => {
      // simplified placeholder
      const priceStr = typeof product[1] === "string" ? product[1].replace(/[^0-9]/g, "") : "0";
      const price = parseInt(priceStr, 10);
      const item = { product, size, quantity, price };
      set((state) => ({ cart: [...state.cart, item] }));
      toast.success("Thêm vào giỏ hàng thành công!");
  },
  handleUpdateCartQty: async (index: number, newQty: number, selectedStoreId?: string) => {
      set((state) => {
          const updated = [...state.cart];
          if (updated[index]) updated[index] = { ...updated[index], quantity: newQty };
          return { cart: updated };
      });
  },
  handleRemoveCartItem: async (index: number, selectedStoreId?: string) => {
      set((state) => ({ cart: state.cart.filter((_, i) => i !== index) }));
  }
}));

// Computed values hook
export const useCartComputed = () => {
  const cart = useCartStore((s) => s.cart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const user = useAuthStore((s) => s.user);

  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  let discount = 0;
  if (user && appliedCoupon) {
      // Basic discount logic
      if (appliedCoupon.discountType === "percent") {
          discount = Math.round(subtotal * (Number(appliedCoupon.discountValue) / 100));
      } else {
          discount = Math.min(subtotal, Number(appliedCoupon.discountValue));
      }
  }

  const shipping = subtotal >= 300000 || subtotal === 0 ? 0 : 15000;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  return { subtotal, discount, shipping, grandTotal };
};
