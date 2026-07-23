import { create } from 'zustand';
import { getStoredUser, getAccessToken, refreshAuthSession } from '../components/authSession';

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
  checkSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  setUser: (user) => set({ user }),
  checkSession: async () => {
    const refreshed = await refreshAuthSession();
    if (refreshed?.user) {
      set({ user: refreshed.user });
    }
  },
  logout: () => {
    localStorage.removeItem("sb_access_token");
    localStorage.removeItem("sb_refresh_token");
    localStorage.removeItem("sb_user");
    set({ user: null });
  }
}));
