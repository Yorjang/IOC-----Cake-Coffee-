import { ChevronDown, Loader2 } from "lucide-react";
import type { AdministrativeDivision } from "../types";

interface AdministrativeAddressFieldProps {
  provinces: AdministrativeDivision[];
  wards: AdministrativeDivision[];
  provinceCode: string;
  wardCode: string;
  specificAddress: string;
  isLoadingProvinces: boolean;
  isLoadingWards: boolean;
  error: string | null;
  onProvinceChange: (code: string) => void;
  onWardChange: (code: string) => void;
  onSpecificAddressChange: (value: string) => void;
}

export function AdministrativeAddressField(props: AdministrativeAddressFieldProps) {
  const selectClassName = "w-full appearance-none rounded-xl border bg-input px-3 py-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Tỉnh/Thành phố</label>
        <div className="relative">
          <select value={props.provinceCode} onChange={event => props.onProvinceChange(event.target.value)} disabled={props.isLoadingProvinces} className={selectClassName}>
            <option value="">Chọn Tỉnh/Thành phố</option>
            {props.provinces.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
          {props.isLoadingProvinces ? <Loader2 className="absolute right-3 top-3.5 animate-spin text-muted-foreground" size={16} /> : <ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" size={16} />}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Phường/Xã</label>
        <div className="relative">
          <select value={props.wardCode} onChange={event => props.onWardChange(event.target.value)} disabled={!props.provinceCode || props.isLoadingWards} className={selectClassName}>
            <option value="">{props.provinceCode ? "Chọn Phường/Xã" : "Vui lòng chọn Tỉnh/Thành phố trước"}</option>
            {props.wards.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
          {props.isLoadingWards ? <Loader2 className="absolute right-3 top-3.5 animate-spin text-muted-foreground" size={16} /> : <ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" size={16} />}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Địa chỉ cụ thể</label>
        <textarea value={props.specificAddress} onChange={event => props.onSpecificAddressChange(event.target.value)} disabled={!props.wardCode && !props.specificAddress} rows={2} placeholder="Số nhà, tên đường..." className="w-full resize-none rounded-xl border bg-input px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60" />
      </div>
      {props.error && <p className="text-xs font-medium text-red-600">{props.error}</p>}
    </div>
  );
}
