import { Stack } from 'expo-router';
import React from 'react';

import { AuthProvider } from '@/src/store/AuthContext';
import { PortfolioProvider } from '@/src/store/PortfolioContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="quick-deposit" options={{ title: 'Aporte Rapido' }} />
          <Stack.Screen name="sync-portfolio" options={{ title: 'Sincronizar Carteiras' }} />
        </Stack>
      </PortfolioProvider>
    </AuthProvider>
  );
}
