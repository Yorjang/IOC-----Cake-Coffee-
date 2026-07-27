export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'completed' | 'cancelled';
export type FulfillmentType = 'delivery' | 'pickup';

export interface TrackingOrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number | string;
  discountAmount: number | string;
  totalPrice: number | string;
}

export interface TrackingBranch {
  name: string;
  address: string;
  phone: string | null;
}

export interface TrackingOrder {
  id: string;
  orderCode: string;
  orderStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number | string;
  discountAmount: number | string;
  shippingFee: number | string;
  totalAmount: number | string;
  shippingRecipientName: string | null;
  shippingAddressPhone: string | null;
  shippingAddressStreet: string | null;
  shippingAddressWard: string | null;
  shippingAddressDistrict: string | null;
  shippingAddressProvince: string | null;
  pickupAt: string | null;
  deliveryAt: string | null;
  note: string | null;
  createdAt: string;
  items: TrackingOrderItem[];
  branch: TrackingBranch;
}

export interface TrackingStep {
  key: OrderStatus;
  label: string;
  description: string;
}
