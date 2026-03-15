import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/src/theme/tokens';

type DSButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function DSButton({ title, onPress, disabled = false, testID }: DSButtonProps) {
  return (
    <Pressable testID={testID} style={[styles.button, disabled ? styles.buttonDisabled : null]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: theme.colors.primaryText,
    fontWeight: '700',
  },
});
