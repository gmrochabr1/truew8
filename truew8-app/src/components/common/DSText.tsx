import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

import { theme } from '@/src/theme/tokens';

type Variant = 'title' | 'subtitle' | 'label' | 'body' | 'caption';

type DSTextProps = TextProps & {
  variant?: Variant;
};

export function DSText({ variant = 'body', style, ...props }: DSTextProps) {
  return <Text style={[styles.base, styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.textPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
});
