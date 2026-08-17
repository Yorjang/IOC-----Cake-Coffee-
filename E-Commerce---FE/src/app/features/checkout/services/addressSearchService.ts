import type { AddressSuggestion } from "../types";
import { env } from "../../../../config/env";

const VIETNAM_BBOX = "102.14,8.18,109.47,23.39";

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: Record<string, string | number | undefined>;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

const buildAddressLabel = (properties: PhotonFeature["properties"] = {}) => {
  const street = [properties?.housenumber, properties?.street].filter(Boolean).join(" ");
  const parts = [
    properties?.name !== properties?.street ? properties?.name : null,
    street,
    properties?.district,
    properties?.city,
    properties?.state,
    properties?.country,
  ].filter(Boolean);

  return [...new Set(parts.map(String))].join(", ");
};

const mapFeature = (feature: PhotonFeature, index: number): AddressSuggestion | null => {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;

  const label = buildAddressLabel(feature.properties);
  if (!label) return null;

  const primaryText =
    String(feature.properties?.name || feature.properties?.street || label.split(",")[0]);
  const secondaryText = label.startsWith(primaryText)
    ? label.slice(primaryText.length).replace(/^,\s*/, "")
    : label;

  return {
    id: `${feature.properties?.osm_type || "place"}-${feature.properties?.osm_id || index}`,
    label,
    primaryText,
    secondaryText,
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
};

const fetchPhoton = async (url: URL, signal?: AbortSignal): Promise<AddressSuggestion[]> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Không thể tìm địa chỉ lúc này.");

  const data = (await response.json()) as PhotonResponse;
  return (data.features ?? [])
    .map(mapFeature)
    .filter((item): item is AddressSuggestion => item !== null);
};

export const searchVietnameseAddresses = (
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> => {
  const vietMapUrl = new URL("/geocoding/autocomplete", env.API_URL);
  vietMapUrl.searchParams.set("text", query);
  return fetch(vietMapUrl, { signal })
    .then(async (response) => {
      if (!response.ok) throw new Error("VietMap unavailable");
      const payload = await response.json();
      return Array.isArray(payload?.data) ? payload.data : [];
    })
    .catch((error: Error) => {
      if (error.name === "AbortError") throw error;
      return searchWithPhoton(query, signal);
    });
};

const searchWithPhoton = (
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> => {
  const url = new URL("/api", env.GEOCODING_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("bbox", VIETNAM_BBOX);
  return fetchPhoton(url, signal);
};

export const resolveVietnameseAddress = async (
  suggestion: AddressSuggestion,
  signal?: AbortSignal,
): Promise<AddressSuggestion> => {
  if (suggestion.latitude !== null && suggestion.longitude !== null) return suggestion;
  if (!suggestion.refId) throw new Error("Địa chỉ chưa có tọa độ");

  const url = new URL("/geocoding/place", env.API_URL);
  url.searchParams.set("refId", suggestion.refId);
  const response = await fetch(url, { signal });
  const payload = await response.json();
  if (!response.ok || !payload?.data) throw new Error(payload?.message || "Không thể xác định tọa độ địa chỉ");
  return payload.data as AddressSuggestion;
};

export const reverseGeocodeAddress = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AddressSuggestion | null> => {
  try {
    const vietMapUrl = new URL("/geocoding/reverse", env.API_URL);
    vietMapUrl.searchParams.set("lat", String(latitude));
    vietMapUrl.searchParams.set("lng", String(longitude));
    const response = await fetch(vietMapUrl, { signal });
    const payload = await response.json();
    if (response.ok && payload?.data) return payload.data as AddressSuggestion;
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
  }

  const url = new URL("/reverse", env.GEOCODING_API_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("limit", "1");
  const [result] = await fetchPhoton(url, signal);
  return result ?? null;
};
