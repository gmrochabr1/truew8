import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/src/theme/tokens';

type DSInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  testID?: string;
};

export function DSInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  testID,
}: DSInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
    flex: 1,
  },
  label: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panel,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
});
