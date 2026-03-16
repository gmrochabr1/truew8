import React from 'react';
import { Tabs } from 'expo-router';

import { theme } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.primaryText,
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: '#7A8BA5',
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          backgroundColor: '#FAFCFF',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
    </Tabs>
  );
}
