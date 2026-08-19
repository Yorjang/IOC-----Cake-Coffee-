export interface DeliveryCoordinates {
  latitude: number;
  longitude: number;
}

export interface AdministrativeDivision {
  code: number;
  name: string;
  codename: string;
  divisionType: string;
  provinceCode?: number;
}

export interface AddressSuggestion {
  id: string;
  refId?: string;
  label: string;
  primaryText: string;
  secondaryText: string;
  latitude: number | null;
  longitude: number | null;
}

export interface DeliveryQuote {
  branch: {
    id: string;
    name: string;
    address: string;
  };
  distanceKm: number;
  durationMinutes: number | null;
  shippingFee: number;
}

export interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  label: string | null;
  isDefault: boolean;
}

export interface SavedAddressPayload {
  recipientName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  label?: string;
  isDefault?: boolean;
}
