import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistContextType {
  wishlist: any[];
  toggleWishlist: (product: any) => void;
  isInWishlist: (product: any) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("sb_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("sb_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product: any) => {
    setWishlist(prev => {
      const isExist = prev.find(p => p[0] === product[0]);
      if (isExist) {
        return prev.filter(p => p[0] !== product[0]);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (product: any) => {
    if (!product) return false;
    return wishlist.some(p => p[0] === product[0]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
