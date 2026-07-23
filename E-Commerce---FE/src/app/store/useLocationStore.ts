import { create } from 'zustand';
const fallbackStoreLocations: any[] = [];

const STORE_STORAGE_KEY = "sb_selected_store";

interface LocationState {
  selectedStore: StoreLocation;
  availableStores: StoreLocation[];
  showStorePopup: boolean;
  manualLocationRequired: boolean;
  
  setSelectedStore: (store: StoreLocation) => void;
  setAvailableStores: (stores: StoreLocation[]) => void;
  setShowStorePopup: (show: boolean) => void;
  setManualLocationRequired: (required: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedStore: (() => {
    const saved = localStorage.getItem(STORE_STORAGE_KEY);
    const savedStore = saved ? fallbackStoreLocations.find((store: any) => store.id === saved) : null;
    return savedStore ?? fallbackStoreLocations[0];
  })(),
  availableStores: fallbackStoreLocations,
  showStorePopup: window.location.pathname === "/" && !localStorage.getItem(STORE_STORAGE_KEY),
  manualLocationRequired: false,

  setSelectedStore: (selectedStore) => {
    set({ selectedStore });
    localStorage.setItem(STORE_STORAGE_KEY, selectedStore.id);
  },
  setAvailableStores: (availableStores) => set({ availableStores }),
  setShowStorePopup: (showStorePopup) => set({ showStorePopup }),
  setManualLocationRequired: (manualLocationRequired) => set({ manualLocationRequired }),
}));
