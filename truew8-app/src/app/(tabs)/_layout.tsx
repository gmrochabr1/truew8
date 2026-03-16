import React from 'react';
import { Tabs } from 'expo-router';

import { theme } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          width: '100%',
          maxWidth: 1024,
          alignSelf: 'center',
          backgroundColor: theme.colors.background,
        },
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
    </Tabs>
  );
}
