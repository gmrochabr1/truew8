import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DSText } from '@/src/components/common/DSText';
import { theme } from '@/src/theme/tokens';

type AuthLoadingScreenProps = {
  message?: string;
};

export function AuthLoadingScreen({ message = 'Carregando sessao...' }: AuthLoadingScreenProps) {
  return (
    <View style={styles.screen} testID="auth-loading-screen">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <DSText variant="caption" style={styles.message}>{message}</DSText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  message: {
    fontSize: 13,
  },
});
