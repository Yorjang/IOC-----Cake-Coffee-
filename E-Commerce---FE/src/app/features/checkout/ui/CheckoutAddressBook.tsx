import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SavedAddress, SavedAddressPayload } from "../types";
import { useAddressEditor } from "../hooks/useAddressEditor";
import { AdministrativeAddressField } from "./AdministrativeAddressField";
import { AddressMapPicker } from "./AddressMapPicker";

interface CheckoutAddressBookProps {
  addresses: SavedAddress[];
  currentAddress: string;
  loading: boolean;
  saving: boolean;
  isOpen: boolean;
  editing: SavedAddress | null;
  onSelect: (address: SavedAddress) => void;
  onAdd: () => void;
  onEdit: (address: SavedAddress) => void;
  onClose: () => void;
  onSave: (payload: SavedAddressPayload) => void;
  onRemove: (id: string) => void;
}

export function CheckoutAddressBook(props: CheckoutAddressBookProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Địa chỉ của tôi</p>
          <p className="text-xs text-muted-foreground">Chọn địa chỉ đã lưu để giao hàng nhanh hơn</p>
        </div>
        <button type="button" onClick={props.onAdd} className="flex items-center gap-1 text-xs font-semibold text-primary">
          <Plus size={14} /> Thêm địa chỉ
        </button>
      </div>

      {props.loading ? (
        <div className="flex items-center gap-2 rounded-xl border p-3 text-xs text-muted-foreground"><Loader2 className="animate-spin" size={15} /> Đang tải địa chỉ...</div>
      ) : props.addresses.length > 0 ? (
        <div
          className={`${props.addresses.length > 2 ? "h-56" : "max-h-56"} min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]`}
        >
          {props.addresses.map(item => {
            const selected = props.currentAddress === item.address;
            return (
              <div key={item.id} className={`rounded-xl border p-3 ${selected ? "border-primary bg-primary/5" : "bg-card"}`}>
                <button type="button" onClick={() => props.onSelect(item)} className="w-full text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{item.recipientName}</span><span className="font-normal text-muted-foreground">{item.phone}</span>
                    {item.label && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-primary">{item.label}</span>}
                    {item.isDefault && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">Mặc định</span>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.address}</p>
                </button>
                <div className="mt-2 flex justify-end gap-3 border-t pt-2">
                  <button type="button" onClick={() => props.onEdit(item)} className="flex items-center gap-1 text-xs font-medium text-primary"><Pencil size={12} /> Sửa</button>
                  <button type="button" onClick={() => props.onRemove(item.id)} className="flex items-center gap-1 text-xs font-medium text-red-600"><Trash2 size={12} /> Xóa</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <button type="button" onClick={props.onAdd} className="w-full rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          Bạn chưa có địa chỉ nào. Nhấn để thêm địa chỉ đầu tiên.
        </button>
      )}

      {props.isOpen && <AddressEditorModal {...props} />}
    </div>
  );
}

function AddressEditorModal(props: CheckoutAddressBookProps) {
  const editor = useAddressEditor(props.editing);
  const [isResolving, setIsResolving] = useState(false);
  const submit = async () => {
    setIsResolving(true);
    let payload: SavedAddressPayload | null = null;
    try {
      payload = await editor.buildPayload();
    } catch {
      toast.error("Không thể xác định tọa độ địa chỉ. Vui lòng kiểm tra và thử lại");
      return;
    } finally {
      setIsResolving(false);
    }
    if (!payload) {
      toast.error("Vui lòng nhập đầy đủ thông tin và chọn Tỉnh/Thành phố, Phường/Xã");
      return;
    }
    props.onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={event => event.target === event.currentTarget && props.onClose()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{props.editing ? "Cập nhật địa chỉ" : "Địa chỉ mới"}</h3>
          <button type="button" onClick={props.onClose}><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={editor.recipientName} onChange={e => editor.setRecipientName(e.target.value)} placeholder="Họ tên người nhận" className="rounded-xl border bg-input px-3 py-2.5 text-sm" />
            <input value={editor.phone} onChange={e => editor.setPhone(e.target.value)} placeholder="Số điện thoại" className="rounded-xl border bg-input px-3 py-2.5 text-sm" />
          </div>
          <AdministrativeAddressField
            provinces={editor.administrativeAddress.provinces}
            wards={editor.administrativeAddress.wards}
            provinceCode={editor.administrativeAddress.provinceCode}
            wardCode={editor.administrativeAddress.wardCode}
            specificAddress={editor.specificAddress}
            isLoadingProvinces={editor.administrativeAddress.isLoadingProvinces}
            isLoadingWards={editor.administrativeAddress.isLoadingWards}
            error={editor.administrativeAddress.error}
            onProvinceChange={editor.administrativeAddress.setProvinceCode}
            onWardChange={editor.administrativeAddress.setWardCode}
            onSpecificAddressChange={editor.setSpecificAddress}
          />
          <AddressMapPicker
            address={editor.address}
            coordinates={editor.deliveryAddress.coordinates}
            isGeocoding={editor.isGeocoding}
            onCoordinatesChange={editor.updateMapCoordinates}
          />
          <div className="grid grid-cols-3 gap-2">
            {["Nhà riêng", "Văn phòng", "Khác"].map(value => <button key={value} type="button" onClick={() => editor.setLabel(value)} className={`rounded-lg border px-2 py-2 text-xs ${editor.label === value ? "border-primary bg-primary/5 text-primary" : ""}`}>{value}</button>)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.isDefault} onChange={e => editor.setIsDefault(e.target.checked)} className="accent-primary" /> Đặt làm địa chỉ mặc định</label>
          <button type="button" disabled={props.saving || isResolving} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {(props.saving || isResolving) && <Loader2 className="animate-spin" size={16} />} Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}
