import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '../../config/env';
import { clearAuthSession, getAccessToken, refreshAuthSession, getStoredUser } from '../components/authSession';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (tokenData: { accessToken: string; refreshToken: string; user: any }) => void;
  logout: () => void;
  refreshSession: () => Promise<{ accessToken: string; refreshToken: string; user: any } | null>;
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper to standardise parsing responses from the new BE format
  const parseResponse = async (res: Response) => {
    if (res.status === 204) return null;
    const data = await res.json();
    if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
      return (data.data !== undefined && data.data !== null) ? data.data : data;
    }
    return data;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  const login = (tokenData: { accessToken: string; refreshToken: string; user: any }) => {
    setAuthSession(tokenData.accessToken, tokenData.refreshToken, tokenData.user);
    setUser(tokenData.user);
  };

  const refreshSession = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;

      const res = await fetch(`${env.API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const data = await parseResponse(res);
      setAuthSession(data.accessToken, data.refreshToken, data.user);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error("Failed to refresh session", err);
      return null;
    }
  };

  // Initial user load
  useEffect(() => {
    const initAuth = async () => {
      const storedUserStr = localStorage.getItem("user");
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
          
          // Verify with server if token is valid
          const token = getAccessToken();
          if (token) {
            const res = await fetch(`${env.API_URL}/users/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const userData = await parseResponse(res);
              setUser(userData);
              // Update local storage
              localStorage.setItem("user", JSON.stringify(userData));
            } else if (res.status === 401) {
              await refreshSession();
            }
          }
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
