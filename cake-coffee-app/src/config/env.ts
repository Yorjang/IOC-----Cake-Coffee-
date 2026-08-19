import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getHostIp(): string {
  // Automatically extract host machine IP when running Expo Go on real devices or simulators
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const DYNAMIC_HOST_IP = getHostIp();
const DEFAULT_API_URL = `http://${DYNAMIC_HOST_IP}:3000`;

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
  APP_NAME: 'Cake & Coffee Mobile',
  HOST_IP: DYNAMIC_HOST_IP,
};
