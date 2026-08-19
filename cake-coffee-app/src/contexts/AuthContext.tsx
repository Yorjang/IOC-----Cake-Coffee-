import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  reloadProfile: async () => {},
  updateUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const savedUser = await AsyncStorage.getItem('auth_user');
      if (token && savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        await reloadProfile();
      }
    } catch (err) {
      console.warn('Error loading auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadProfile = async () => {
    try {
      const profile = await apiFetch('/users/me').catch(() => apiFetch('/auth/profile'));
      if (profile) {
        const normalized = {
          ...profile,
          avatar: profile.avatar || profile.avatarUrl,
        };
        setUser(normalized);
        await AsyncStorage.setItem('auth_user', JSON.stringify(normalized));
      }
    } catch (e) {}
  };

  const updateUser = async (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newObj = { ...prev, ...updatedData };
      AsyncStorage.setItem('auth_user', JSON.stringify(newObj));
      return newObj;
    });
  };

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = res.accessToken || res.token || res.data?.accessToken;
    const userData = res.user || res.data?.user;

    if (!token || !userData) {
      throw new Error(res?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin hoặc xác thực Gmail.');
    }

    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await apiFetch('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ idToken, remember: true }),
    });

    const token = res.accessToken || res.token || res.data?.accessToken;
    const userData = res.user || res.data?.user;

    if (!token || !userData) {
      throw new Error(res?.message || 'Không thể xác thực thông tin tài khoản Google từ máy chủ.');
    }

    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone }),
    });

    // If verification is required, DO NOT log in or set user state!
    if (res?.requiresVerification || !res?.accessToken || !res?.user) {
      return res;
    }

    const token = res.accessToken || res.token;
    const userData = res.user;

    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    return res;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginWithGoogle, register, logout, reloadProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
