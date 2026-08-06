interface RuntimeEnvironment {
  VITE_API_URL?: string;
  VITE_APP_NAME?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_GEOCODING_API_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

declare global {
  interface Window {
    __RUNTIME_ENV__?: RuntimeEnvironment;
  }
}

const runtimeEnv = typeof window === 'undefined' ? {} : (window.__RUNTIME_ENV__ ?? {});

export const env = {
  API_URL: runtimeEnv.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000',
  APP_NAME: runtimeEnv.VITE_APP_NAME || import.meta.env.VITE_APP_NAME || 'Sweet Bean Coffee & Cake',
  GOOGLE_CLIENT_ID: runtimeEnv.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  GEOCODING_API_URL: runtimeEnv.VITE_GEOCODING_API_URL || import.meta.env.VITE_GEOCODING_API_URL || 'https://photon.komoot.io',
  SUPABASE_URL: runtimeEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://nkhdmjcsmeeulhcynbul.supabase.co',
  SUPABASE_ANON_KEY: runtimeEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};
