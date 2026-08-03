import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";
import type { DeliveryCoordinates, DeliveryQuote } from "../types";

interface DeliveryQuoteCartItem {
  variantId?: string;
  quantity: number;
}

export async function getDeliveryQuote(
  coordinates: DeliveryCoordinates,
  cart: DeliveryQuoteCartItem[],
  signal?: AbortSignal,
): Promise<DeliveryQuote> {
  const url = new URL("/branches/delivery-quote", env.API_URL);
  const items = cart
    .filter((item): item is DeliveryQuoteCartItem & { variantId: string } => Boolean(item.variantId))
    .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      items,
    }),
    signal,
  });
  const data = await parseRes(response);
  if (!response.ok) {
    throw new Error(data?.message || "Không thể tính phí giao hàng.");
  }
  return data as DeliveryQuote;
}
