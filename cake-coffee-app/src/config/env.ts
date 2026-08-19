import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FALLBACK_IP = '192.168.1.184';

function getHostIp(): string {
  // Automatically extract host machine IP when running Expo Go on real devices or simulators
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return FALLBACK_IP;
}

const DYNAMIC_HOST_IP = getHostIp();

function getApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    if (Platform.OS !== 'web' && (configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1'))) {
      return configuredUrl.replace('localhost', DYNAMIC_HOST_IP).replace('127.0.0.1', DYNAMIC_HOST_IP);
    }
    return configuredUrl;
  }
  return `http://${DYNAMIC_HOST_IP}:3000`;
}

export const ENV = {
  API_URL: getApiUrl(),
  APP_NAME: 'Sweet Bean Coffee & Cake',
  HOST_IP: DYNAMIC_HOST_IP,
};
