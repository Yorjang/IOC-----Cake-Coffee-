import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: true,
              title: 'Chi tiết món',
              headerBackTitle: 'Quay lại',
              headerTintColor: '#3E2723',
              headerStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
          <Stack.Screen
            name="points"
            options={{
              headerShown: true,
              title: 'Thẻ Thành Viên & Tích Điểm',
              headerBackTitle: 'Quay lại',
              headerTintColor: '#3E2723',
              headerStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
          <Stack.Screen
            name="order-success"
            options={{
              headerShown: true,
              title: 'Xác Nhận Đặt Hàng',
              headerBackVisible: false,
              headerTintColor: '#3E2723',
              headerStyle: { backgroundColor: '#FFF8F0' },
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
