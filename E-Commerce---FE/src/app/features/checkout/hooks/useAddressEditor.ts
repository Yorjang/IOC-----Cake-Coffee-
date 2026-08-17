import { useEffect, useState } from "react";
import { useDeliveryAddress } from "./useDeliveryAddress";
import type { SavedAddress, SavedAddressPayload } from "../types";

export function useAddressEditor(editing: SavedAddress | null) {
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const deliveryAddress = useDeliveryAddress({ address, setAddress });

  useEffect(() => {
    setRecipientName(editing?.recipientName ?? "");
    setPhone(editing?.phone ?? "");
    setAddress(editing?.address ?? "");
    setLabel(editing?.label ?? "");
    setIsDefault(editing?.isDefault ?? false);
    if (editing) {
      deliveryAddress.applyResolvedAddress(editing.address, {
        latitude: editing.latitude,
        longitude: editing.longitude,
      });
    }
  }, [editing?.id]);

  const buildPayload = (): SavedAddressPayload | null => {
    if (!recipientName.trim() || !phone.trim() || !address.trim() || !deliveryAddress.coordinates) return null;
    return {
      recipientName: recipientName.trim(), phone: phone.trim(), address: address.trim(),
      latitude: deliveryAddress.coordinates.latitude, longitude: deliveryAddress.coordinates.longitude,
      label: label.trim() || undefined, isDefault,
    };
  };

  return {
    recipientName, setRecipientName, phone, setPhone, address, setAddress,
    label, setLabel, isDefault, setIsDefault, deliveryAddress, buildPayload,
  };
}
