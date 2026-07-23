import { create } from 'zustand';

interface ProductState {
  products: any[];
  categories: any[];
  publicCoupons: any[];
  searchQuery: string;
  wishlist: any[];
  
  setProducts: (products: any[]) => void;
  setCategories: (categories: any[]) => void;
  setPublicCoupons: (coupons: any[]) => void;
  setSearchQuery: (query: string) => void;
  setWishlist: (wishlist: any[]) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  categories: [],
  publicCoupons: [],
  searchQuery: "",
  wishlist: (() => {
    try {
      return JSON.parse(localStorage.getItem("sb_wishlist") || "[]");
    } catch {
      return [];
    }
  })(),

  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setPublicCoupons: (publicCoupons) => set({ publicCoupons }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setWishlist: (wishlist) => {
    set({ wishlist });
    localStorage.setItem("sb_wishlist", JSON.stringify(wishlist));
  },
}));
