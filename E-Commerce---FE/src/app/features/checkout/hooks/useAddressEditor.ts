import { useEffect, useRef, useState } from "react";
import { useDeliveryAddress } from "./useDeliveryAddress";
import { useAdministrativeAddress } from "./useAdministrativeAddress";
import type { DeliveryCoordinates, SavedAddress, SavedAddressPayload } from "../types";
import { geocodeVietnameseAddress } from "../services/addressSearchService";

const normalizeDivisionName = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .toLowerCase()
  .replace(/^(tinh|thanh pho|phuong|xa|thi tran|dac khu)\s+/, "")
  .replace(/[^a-z0-9]/g, "");

const findAddressPart = (address: string, divisionName: string) => {
  const normalizedDivision = normalizeDivisionName(divisionName);
  return address.split(",").find(part => normalizeDivisionName(part.trim()) === normalizedDivision);
};

export function useAddressEditor(editing: SavedAddress | null) {
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const deliveryAddress = useDeliveryAddress({ address, setAddress });
  const administrativeAddress = useAdministrativeAddress();
  const [specificAddress, setSpecificAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const hydratedEditingIdRef = useRef<string | null>(null);

  useEffect(() => {
    setRecipientName(editing?.recipientName ?? "");
    setPhone(editing?.phone ?? "");
    setAddress(editing?.address ?? "");
    setSpecificAddress(editing?.address ?? "");
    setLabel(editing?.label ?? "");
    setIsDefault(editing?.isDefault ?? false);
    hydratedEditingIdRef.current = null;
    if (editing) {
      deliveryAddress.applyResolvedAddress(editing.address, {
        latitude: editing.latitude,
        longitude: editing.longitude,
      });
    }
  }, [editing?.id]);

  useEffect(() => {
    if (!editing || administrativeAddress.provinceCode || administrativeAddress.provinces.length === 0) return;
    const province = administrativeAddress.provinces.find(item => findAddressPart(editing.address, item.name));
    if (province) administrativeAddress.setProvinceCode(String(province.code));
  }, [editing?.id, administrativeAddress.provinceCode, administrativeAddress.provinces]);

  useEffect(() => {
    if (!editing || !administrativeAddress.province || administrativeAddress.wards.length === 0) return;
    if (hydratedEditingIdRef.current === editing.id) return;
    const ward = administrativeAddress.wards.find(item => findAddressPart(editing.address, item.name));
    if (!ward) return;

    const administrativeParts = new Set([
      normalizeDivisionName(administrativeAddress.province.name),
      normalizeDivisionName(ward.name),
    ]);
    const streetAddress = editing.address
      .split(",")
      .map(part => part.trim())
      .filter(part => !administrativeParts.has(normalizeDivisionName(part)))
      .join(", ");

    setSpecificAddress(streetAddress);
    administrativeAddress.setWardCode(String(ward.code));
    hydratedEditingIdRef.current = editing.id;
  }, [editing?.id, administrativeAddress.province, administrativeAddress.wards]);

  useEffect(() => {
    if (!administrativeAddress.province || !administrativeAddress.ward || !specificAddress.trim()) return;
    setAddress([
      specificAddress.trim(),
      administrativeAddress.ward.name,
      administrativeAddress.province.name,
    ].join(", "));
  }, [administrativeAddress.province, administrativeAddress.ward, specificAddress]);

  useEffect(() => {
    if (!administrativeAddress.province || !administrativeAddress.ward || specificAddress.trim().length < 3) return;
    let isActive = true;
    const timer = window.setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const coordinates = await geocodeVietnameseAddress(address.trim());
        if (isActive && coordinates) deliveryAddress.applyResolvedAddress(address.trim(), coordinates);
      } catch {
        // Người dùng vẫn có thể hoàn tất sau khi dịch vụ geocoding hoạt động lại.
      } finally {
        if (isActive) setIsGeocoding(false);
      }
    }, 700);
    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [address, administrativeAddress.province, administrativeAddress.ward, specificAddress]);

  const updateSpecificAddress = (value: string) => {
    setSpecificAddress(value);
    if (!administrativeAddress.province || !administrativeAddress.ward) setAddress(value);
  };

  const updateMapCoordinates = (coordinates: DeliveryCoordinates) => {
    deliveryAddress.applyResolvedAddress(address.trim(), coordinates);
  };

  const buildPayload = async (): Promise<SavedAddressPayload | null> => {
    if (!recipientName.trim() || !phone.trim() || !address.trim()) return null;
    if (!editing && (!administrativeAddress.province || !administrativeAddress.ward || !specificAddress.trim())) return null;
    const coordinates = deliveryAddress.coordinates ?? await geocodeVietnameseAddress(address.trim());
    if (!coordinates) return null;
    return {
      recipientName: recipientName.trim(), phone: phone.trim(), address: address.trim(),
      latitude: coordinates.latitude, longitude: coordinates.longitude,
      label: label.trim() || undefined, isDefault,
    };
  };

  return {
    recipientName, setRecipientName, phone, setPhone, address, setAddress,
    label, setLabel, isDefault, setIsDefault, deliveryAddress, buildPayload,
    administrativeAddress, specificAddress, setSpecificAddress: updateSpecificAddress,
    isGeocoding, updateMapCoordinates,
  };
}
