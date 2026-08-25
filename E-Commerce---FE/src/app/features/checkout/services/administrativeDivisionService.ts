import type { AdministrativeDivision } from "../types";

const ADMINISTRATIVE_API_URL = "https://provinces.open-api.vn/api/v2";

interface AdministrativeDivisionResponse {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code?: number;
}

const mapDivision = (item: AdministrativeDivisionResponse): AdministrativeDivision => ({
  code: item.code,
  name: item.name,
  codename: item.codename,
  divisionType: item.division_type,
  provinceCode: item.province_code,
});

const fetchDivisions = async (url: string, signal?: AbortSignal): Promise<AdministrativeDivision[]> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Không thể tải dữ liệu địa giới hành chính.");
  const payload = (await response.json()) as AdministrativeDivisionResponse[];
  return payload.map(mapDivision);
};

export const getProvinces = (signal?: AbortSignal) =>
  fetchDivisions(`${ADMINISTRATIVE_API_URL}/p/`, signal);

export const getWards = (provinceCode: number, signal?: AbortSignal) =>
  fetchDivisions(`${ADMINISTRATIVE_API_URL}/w/?province=${provinceCode}`, signal);
