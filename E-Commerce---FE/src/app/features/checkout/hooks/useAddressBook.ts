import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createSavedAddress, deleteSavedAddress, getSavedAddresses, updateSavedAddress } from "../services/savedAddressService";
import type { DeliveryCoordinates, SavedAddress, SavedAddressPayload } from "../types";

interface UseAddressBookParams {
  enabled: boolean;
  onSelect: (address: SavedAddress) => void;
}

export function useAddressBook({ enabled, onSelect }: UseAddressBookParams) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  const load = async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const items = await getSavedAddresses();
      setAddresses(items);
      const preferred = items.find(item => item.isDefault) ?? items[0];
      if (preferred) onSelect(preferred);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [enabled]);

  const save = async (payload: SavedAddressPayload) => {
    setSaving(true);
    try {
      const saved = editing
        ? await updateSavedAddress(editing.id, payload)
        : await createSavedAddress(payload);
      await load();
      onSelect(saved);
      setIsOpen(false);
      setEditing(null);
      toast.success(editing ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteSavedAddress(id);
      await load();
      toast.success("Đã xóa địa chỉ");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const select = (item: SavedAddress) => onSelect(item);
  const add = () => { setEditing(null); setIsOpen(true); };
  const edit = (item: SavedAddress) => { setEditing(item); setIsOpen(true); };
  const close = () => { setIsOpen(false); setEditing(null); };

  return { addresses, loading, saving, isOpen, editing, select, add, edit, close, save, remove };
}
