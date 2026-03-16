import { Stack } from 'expo-router';
import React from 'react';

import { VaultGuard } from '@/src/components/security/VaultGuard';
import { AuthProvider } from '@/src/store/AuthContext';
import { useAuth } from '@/src/store/AuthContext';
import { VaultProvider } from '@/src/store/VaultContext';

function ProtectedAppShell() {
  const { email, isAuthenticated } = useAuth();

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
              animation: 'slide_from_right',
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
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <VaultProvider>
        <ProtectedAppShell />
      </VaultProvider>
    </AuthProvider>
  );
}
