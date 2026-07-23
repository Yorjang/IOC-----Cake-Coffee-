import { create } from 'zustand';

interface OrderState {
  lastCreatedOrder: any | null;
  selectedOrderId: string | null;
  
  setLastCreatedOrder: (order: any | null) => void;
  setSelectedOrderId: (id: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  lastCreatedOrder: null,
  selectedOrderId: null,
  
  setLastCreatedOrder: (lastCreatedOrder) => set({ lastCreatedOrder }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId })
}));
