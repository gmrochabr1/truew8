import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/src/i18n';
import { theme } from '@/src/theme/tokens';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('tab.secondary')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
