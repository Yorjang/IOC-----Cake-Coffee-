import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/apiClient';

export interface BranchStore {
  id: string;
  name: string;
  address: string;
  phone?: string;
  distanceKm?: number;
}

interface StoreContextType {
  stores: BranchStore[];
  selectedStore: BranchStore | null;
  isLoading: boolean;
  selectStore: (store: BranchStore) => void;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  selectedStore: null,
  isLoading: false,
  selectStore: () => {},
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<BranchStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<BranchStore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/branches');
      if (Array.isArray(data) && data.length > 0) {
        const formatted: BranchStore[] = data.map((item: any) => ({
          id: item.id || item.branchId,
          name: item.name || item.branchName,
          address: item.address || item.streetAddress || 'TP. Hồ Chí Minh',
          phone: item.phone,
        }));
        setStores(formatted);

        const savedId = await AsyncStorage.getItem('selected_store_id');
        const matched = savedId ? formatted.find((s) => s.id === savedId) : formatted[0];
        setSelectedStore(matched || formatted[0]);
      } else {
        setStores([]);
        setSelectedStore(null);
      }
    } catch (e) {
      setStores([]);
      setSelectedStore(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selectStore = async (store: BranchStore) => {
    setSelectedStore(store);
    await AsyncStorage.setItem('selected_store_id', store.id);
  };

  return (
    <StoreContext.Provider value={{ stores, selectedStore, isLoading, selectStore }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
