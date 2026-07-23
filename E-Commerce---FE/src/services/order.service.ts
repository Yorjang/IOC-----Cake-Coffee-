import { env } from "../config/env";
import { parseRes } from "../utils/api";

export const OrderService = {
  fetchOrder: async (orderId: string) => {
    const res = await fetch(`${env.API_URL}/orders/public/${orderId}`);
    if (!res.ok) throw new Error("Cannot load order");
    return await parseRes(res);
  }
};
