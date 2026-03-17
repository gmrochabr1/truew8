import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/src/theme/tokens';

type DSInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  testID?: string;
  rightElement?: React.ReactNode;
};

export function DSInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  maxLength = 160,
  testID,
  rightElement,
}: DSInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          testID={testID}
          accessibilityLabel={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          placeholderTextColor={theme.colors.textMuted}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
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
  inputRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
    backgroundColor: 'rgb(232, 240, 254)',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineColor: 'transparent',
        boxShadow: 'none',
      } as never,
      default: {},
    }),
  },
  rightElement: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
