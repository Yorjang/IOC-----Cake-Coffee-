export interface DeliveryCoordinates {
  latitude: number;
  longitude: number;
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
