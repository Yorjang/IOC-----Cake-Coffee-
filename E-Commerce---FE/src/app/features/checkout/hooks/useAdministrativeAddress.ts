import { useEffect, useMemo, useState } from "react";
import { getProvinces, getWards } from "../services/administrativeDivisionService";
import type { AdministrativeDivision } from "../types";

export function useAdministrativeAddress() {
  const [provinces, setProvinces] = useState<AdministrativeDivision[]>([]);
  const [wards, setWards] = useState<AdministrativeDivision[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingProvinces(true);
    getProvinces(controller.signal)
      .then(setProvinces)
      .catch(reason => {
        if ((reason as Error).name !== "AbortError") setError("Không thể tải danh sách Tỉnh/Thành phố.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingProvinces(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setWardCode("");
    setWards([]);
    if (!provinceCode) return;
    const controller = new AbortController();
    setIsLoadingWards(true);
    setError(null);
    getWards(Number(provinceCode), controller.signal)
      .then(setWards)
      .catch(reason => {
        if ((reason as Error).name !== "AbortError") setError("Không thể tải danh sách Phường/Xã.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingWards(false);
      });
    return () => controller.abort();
  }, [provinceCode]);

  const province = useMemo(
    () => provinces.find(item => item.code === Number(provinceCode)) ?? null,
    [provinceCode, provinces],
  );
  const ward = useMemo(
    () => wards.find(item => item.code === Number(wardCode)) ?? null,
    [wardCode, wards],
  );

  return {
    provinces, wards, provinceCode, wardCode, province, ward,
    isLoadingProvinces, isLoadingWards, error, setProvinceCode, setWardCode,
  };
}
