import { env } from "../config/env";
import { parseRes } from "../utils/api";

export const ProductService = {
  fetchProducts: async () => {
    const res = await fetch(`${env.API_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
  },
  fetchCategories: async () => {
    const res = await fetch(`${env.API_URL}/products/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
  },
  fetchPublicCoupons: async () => {
    const res = await fetch(`${env.API_URL}/coupons/public`);
    if (!res.ok) throw new Error("Failed to fetch coupons");
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
  }
};
