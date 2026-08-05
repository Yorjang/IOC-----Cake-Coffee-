import { MapPin } from "lucide-react";
import { useAddressBook } from "../../checkout/hooks/useAddressBook";
import { CheckoutAddressBook } from "../../checkout/ui/CheckoutAddressBook";

interface ProfileAddressBookProps {
  userId: string | null;
}

export function ProfileAddressBook({ userId }: ProfileAddressBookProps) {
  const addressBook = useAddressBook({ enabled: Boolean(userId), onSelect: () => undefined });
  const defaultAddress = addressBook.addresses.find(item => item.isDefault)?.address ?? "";

  return (
    <section className="space-y-3 border-t pt-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <MapPin size={17} />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Sổ địa chỉ nhận hàng</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Quản lý các địa chỉ dùng khi thanh toán và chọn một địa chỉ mặc định.
          </p>
        </div>
      </div>

      <CheckoutAddressBook
        addresses={addressBook.addresses}
        currentAddress={defaultAddress}
        loading={addressBook.loading}
        saving={addressBook.saving}
        isOpen={addressBook.isOpen}
        editing={addressBook.editing}
        onSelect={addressBook.select}
        onAdd={addressBook.add}
        onEdit={addressBook.edit}
        onClose={addressBook.close}
        onSave={addressBook.save}
        onRemove={addressBook.remove}
      />
    </section>
  );
}
