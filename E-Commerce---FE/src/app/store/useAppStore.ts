import { create } from 'zustand';
import { VIEW_KEYS } from '../../config/appConfig';

interface AppState {
  view: string;
  setView: (view: string, target?: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: VIEW_KEYS.HOME,
  setView: (view, target) => {
    set({ view });
    // router sync is handled by components now
  },
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading })
}));
