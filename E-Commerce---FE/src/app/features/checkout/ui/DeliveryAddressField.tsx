import { CheckCircle2, Crosshair, Loader2, MapPin } from "lucide-react";
import type { AddressSuggestion, DeliveryCoordinates } from "../types";

interface DeliveryAddressFieldProps {
  address: string;
  onAddressChange: (address: string) => void;
  suggestions: AddressSuggestion[];
  coordinates: DeliveryCoordinates | null;
  isSearching: boolean;
  isLocating: boolean;
  addressError: string | null;
  isSuggestionOpen: boolean;
  onSuggestionOpenChange: (open: boolean) => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
  onUseCurrentLocation: () => void;
}

export function DeliveryAddressField({
  address,
  onAddressChange,
  suggestions,
  coordinates,
  isSearching,
  isLocating,
  addressError,
  isSuggestionOpen,
  onSuggestionOpenChange,
  onSelectSuggestion,
  onUseCurrentLocation,
}: DeliveryAddressFieldProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor="delivery-address" className="text-xs font-semibold text-muted-foreground">
          Địa chỉ giao hàng cụ thể
        </label>
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="animate-spin" size={13} /> : <Crosshair size={13} />}
          {isLocating ? "Đang định vị..." : "Dùng vị trí hiện tại"}
        </button>
      </div>

      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-muted-foreground" size={17} />
          <input
            id="delivery-address"
            required
            autoComplete="off"
            maxLength={130}
            value={address}
            onFocus={() => onSuggestionOpenChange(true)}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="VD: Số 25 ngõ 68 Nguyễn Trãi, Thanh Xuân, Hà Nội"
            className="w-full rounded-xl border bg-input py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary"
          />
          {isSearching && <Loader2 className="absolute right-3 top-3 animate-spin text-primary" size={17} />}
          {!isSearching && coordinates && <CheckCircle2 className="absolute right-3 top-3 text-green-600" size={17} />}
        </div>

        {isSuggestionOpen && suggestions.length > 0 && (
          <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectSuggestion(suggestion)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPin size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{suggestion.primaryText}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{suggestion.secondaryText}</span>
                </span>
              </button>
            ))}
            <p className="border-t px-3 pt-2 text-[10px] text-muted-foreground">Dữ liệu địa chỉ © OpenStreetMap contributors</p>
          </div>
        )}
      </div>

      {!coordinates && (
        <p className="mt-2 text-xs text-muted-foreground">Chọn một địa chỉ gợi ý để xác nhận đúng vị trí giao hàng.</p>
      )}
      {addressError && <p className="mt-2 text-xs font-medium text-red-600">{addressError}</p>}

    </div>
  );
}
