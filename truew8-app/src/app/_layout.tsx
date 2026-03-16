import { Stack } from 'expo-router';
import React from 'react';

import { AuthProvider } from '@/src/store/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="portfolio/[id]" options={{ title: 'Carteira' }} />
        <Stack.Screen name="portfolio/[id]/rebalance" options={{ title: 'Novo aporte' }} />
      </Stack>
    </AuthProvider>
  );
}
