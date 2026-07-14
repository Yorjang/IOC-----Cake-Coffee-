import { env } from "../../config/env";

const AUTH_KEYS = ["accessToken", "refreshToken", "user"] as const;
const REMEMBER_KEY = "sb_remember_login";

export type AuthSessionData = {
  accessToken: string;
  refreshToken?: string;
  user: any;
};

export const getAuthItem = (key: typeof AUTH_KEYS[number]) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key);

export const getAccessToken = () => getAuthItem("accessToken");
export const getRefreshToken = () => getAuthItem("refreshToken");
export const getStoredUser = () => {
  try {
    return JSON.parse(getAuthItem("user") || "null");
  } catch {
    return null;
  }
};

export const isRememberedSession = () => localStorage.getItem(REMEMBER_KEY) === "true";

export function clearAuthSession() {
  AUTH_KEYS.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  localStorage.removeItem(REMEMBER_KEY);
}

export function saveAuthSession(data: AuthSessionData, remember: boolean) {
  clearAuthSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("accessToken", data.accessToken);
  if (data.refreshToken) storage.setItem("refreshToken", data.refreshToken);
  storage.setItem("user", JSON.stringify(data.user));
  if (remember) localStorage.setItem(REMEMBER_KEY, "true");
}

export async function refreshAuthSession(): Promise<AuthSessionData | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${env.API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const session = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
    saveAuthSession(session, isRememberedSession());
    return session;
  } catch {
    return null;
  }
}

export function getAccessTokenExpiry(): number | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
