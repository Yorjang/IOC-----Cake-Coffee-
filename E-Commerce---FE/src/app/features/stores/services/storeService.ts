import { env } from "../../../../config/env";
import type { StoreLocation } from "../../../../data/storeLocations";
import { apiBranchToStore } from "../../../../utils/appUtils";
import { parseRes } from "../../../../utils/api";

interface CustomerCoordinates {
  latitude: number;
  longitude: number;
}

const fetchStores = async (endpoint: string, signal: AbortSignal): Promise<StoreLocation[]> => {
  const response = await fetch(`${env.API_URL}${endpoint}`, { signal });
  if (!response.ok) throw new Error("Không thể tải danh sách chi nhánh");

  const data: unknown = await parseRes(response);
  if (!Array.isArray(data)) return [];
  return data.map(apiBranchToStore);
};

export const getCustomerCoordinates = (): Promise<CustomerCoordinates> => {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Trình duyệt không hỗ trợ định vị"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      reject,
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  });
};

export const getActiveStores = (signal: AbortSignal): Promise<StoreLocation[]> =>
  fetchStores("/branches/active", signal);

export const getNearbyStores = (
  coordinates: CustomerCoordinates,
  signal: AbortSignal,
): Promise<StoreLocation[]> => {
  const params = new URLSearchParams({
    lat: String(coordinates.latitude),
    lng: String(coordinates.longitude),
  });
  return fetchStores(`/branches/nearby?${params.toString()}`, signal);
};
