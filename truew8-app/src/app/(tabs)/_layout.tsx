import React from 'react';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme/tokens';

function DashboardHeaderTitle() {
  return (
    <View style={styles.headerTitleRow}>
      <View style={styles.headerLogoBadge}>
        <Image
          source={require('../../../assets/images/TrueW8-Logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.headerTitleText}>Dashboard</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.primaryText,
        sceneStyle: {
          width: '100%',
          maxWidth: 1024,
          alignSelf: 'center',
          backgroundColor: theme.colors.background,
        },
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: '#7A8BA5',
        tabBarStyle: {
          width: '100%',
          maxWidth: 1024,
          alignSelf: 'center',
          borderTopColor: theme.colors.border,
          backgroundColor: '#FAFCFF',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: () => <DashboardHeaderTitle />,
          tabBarLabel: 'Dashboard',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoBadge: {
    borderRadius: 999,
    backgroundColor: '#F1F6FF',
    borderWidth: 1,
    borderColor: '#98B2D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerLogo: {
    width: 78,
    height: 24,
  },
  headerTitleText: {
    color: theme.colors.primaryText,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
