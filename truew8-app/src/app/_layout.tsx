import { Stack } from 'expo-router';
import React from 'react';
import { useWindowDimensions } from 'react-native';

import { VaultGuard } from '@/src/components/security/VaultGuard';
import { AuthProvider } from '@/src/store/AuthContext';
import { useAuth } from '@/src/store/AuthContext';
import { LocaleProvider } from '@/src/store/LocaleContext';
import { VaultProvider } from '@/src/store/VaultContext';

function ProtectedAppShell() {
  const { email, isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();
  const isCompactPortrait = width < 640 && height >= width;
  const portfolioAnimation = isCompactPortrait ? 'slide_from_bottom' : 'slide_from_right';

  if (isAuthenticated && email) {
    return (
      <VaultGuard email={email}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="portfolio/[id]"
            options={{
              presentation: 'transparentModal',
              animation: portfolioAnimation,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
      </VaultGuard>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="portfolio/[id]"
        options={{
          presentation: 'transparentModal',
          animation: portfolioAnimation,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <VaultProvider>
          <ProtectedAppShell />
        </VaultProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}
