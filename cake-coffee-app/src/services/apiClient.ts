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
      throw new Error(errMsg);
    }

    // According to api-conventions standard, if NestJS returns { success: true, data: ... }, extract data
    if (json && typeof json === 'object' && 'data' in json && (json.success === true || json.success === undefined)) {
      return json.data as T;
    }

    return json as T;
  } catch (error: any) {
    console.warn(`[apiFetch Error] ${url}:`, error.message);
    throw error;
  }
}
