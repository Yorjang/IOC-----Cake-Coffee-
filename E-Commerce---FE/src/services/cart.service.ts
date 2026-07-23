import { env } from "../config/env";
import { parseRes } from "../utils/api";

export const CartService = {
  fetchCart: async (branchId: string, cartSessionId: string, token: string | null) => {
    const headers: Record<string, string> = { "X-Session-Id": cartSessionId };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${env.API_URL}/cart?branchId=${branchId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch cart");
    return await parseRes(res);
  }
};
