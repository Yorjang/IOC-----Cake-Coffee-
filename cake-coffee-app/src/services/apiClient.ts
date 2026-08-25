import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${ENV.API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { message: text };
    }

    if (!res.ok) {
      const errMsg = json?.message || (Array.isArray(json?.message) ? json.message.join(', ') : null) || `HTTP ${res.status}`;
      const err = new Error(errMsg);
      (err as any).status = res.status;
      throw err;
    }

    // According to api-conventions standard, if NestJS returns { success: true, data: ... }, extract data
    if (json && typeof json === 'object' && 'data' in json && (json.success === true || json.success === undefined)) {
      return json.data as T;
    }

    return json as T;
  } catch (error: any) {
    const isAuthError =
      error?.status === 401 ||
      error?.status === 403 ||
      /expired|unauthorized|authorization|forbidden/i.test(error?.message || '');

    const isExpectedAuthEndpointError =
      /invalid credentials|credential|incorrect/i.test(error?.message || '') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    const isNetworkTimeoutOrOffline =
      /network request failed|network request timed out|aborted|failed to fetch|err_connection_refused|connection_refused/i.test(error?.message || '');

    if (isAuthError) {
      await AsyncStorage.removeItem('auth_token').catch(() => {});
      await AsyncStorage.removeItem('auth_user').catch(() => {});
    } else if (isExpectedAuthEndpointError || isNetworkTimeoutOrOffline) {
      // Expected auth validation or temporary network timeout, suppress console.warn noise
    } else {
      console.warn(`[apiFetch Error] ${url}:`, error.message);
    }
    throw error;
  }
}
