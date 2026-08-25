import Constants from 'expo-constants';
import { Platform } from 'react-native';

const CURRENT_LAN_IP = '192.168.1.77';

function getHostIp(): string {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== '192.168.1.184') {
      return ip;
    }
  }
  return CURRENT_LAN_IP;
}

const DYNAMIC_HOST_IP = getHostIp();

function getApiUrl(): string {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
  }

  // Mobile & Local Web: Always point directly to active PC LAN IP
  return `http://${CURRENT_LAN_IP}:3000`;
}

export const ENV = {
  API_URL: getApiUrl(),
  APP_NAME: 'Sweet Bean Coffee & Cake',
  HOST_IP: DYNAMIC_HOST_IP,
};
