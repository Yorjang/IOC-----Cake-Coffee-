export interface DeliveryCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion extends DeliveryCoordinates {
  id: string;
  label: string;
  primaryText: string;
  secondaryText: string;
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
