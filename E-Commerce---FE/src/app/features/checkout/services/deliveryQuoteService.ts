import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";
import type { DeliveryCoordinates, DeliveryQuote } from "../types";

export async function getDeliveryQuote(
  coordinates: DeliveryCoordinates,
  signal?: AbortSignal,
): Promise<DeliveryQuote> {
  const url = new URL("/branches/delivery-quote", env.API_URL);
  url.searchParams.set("lat", String(coordinates.latitude));
  url.searchParams.set("lng", String(coordinates.longitude));

  const response = await fetch(url, { signal });
  const data = await parseRes(response);
  if (!response.ok) {
    throw new Error(data?.message || "Không thể tính phí giao hàng.");
  }
  return data as DeliveryQuote;
}
