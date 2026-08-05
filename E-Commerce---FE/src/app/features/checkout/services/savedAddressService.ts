import { getAccessToken } from "../../../components/authSession";
import { env } from "../../../../config/env";
import { parseRes } from "../../../../utils/api";
import type { SavedAddress, SavedAddressPayload } from "../types";

async function request(path = "", init?: RequestInit): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error("Vui lòng đăng nhập để quản lý địa chỉ");
  const response = await fetch(`${env.API_URL}/users/addresses${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const data = await parseRes(response);
  if (!response.ok) throw new Error(data?.message || "Không thể cập nhật địa chỉ");
  return data;
}

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const data = await request();
  return Array.isArray(data) ? data.map(normalizeAddress) : [];
}

export async function createSavedAddress(payload: SavedAddressPayload): Promise<SavedAddress> {
  return normalizeAddress(await request("", { method: "POST", body: JSON.stringify(payload) }));
}

export async function updateSavedAddress(id: string, payload: SavedAddressPayload): Promise<SavedAddress> {
  return normalizeAddress(await request(`/${id}`, { method: "PATCH", body: JSON.stringify(payload) }));
}

export async function deleteSavedAddress(id: string): Promise<void> {
  await request(`/${id}`, { method: "DELETE" });
}

function normalizeAddress(value: any): SavedAddress {
  return { ...value, latitude: Number(value.latitude), longitude: Number(value.longitude) };
}
