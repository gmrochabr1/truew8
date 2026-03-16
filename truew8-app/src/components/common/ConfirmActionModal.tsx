import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSText } from '@/src/components/common/DSText';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

type ConfirmActionModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busyConfirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export function ConfirmActionModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busyConfirmLabel,
  isBusy = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmActionModalProps) {
  const { t } = useLocale();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay} testID={testID}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <View style={styles.headlineWrap}>
            <DSText style={styles.title}>{title}</DSText>
            <DSText style={styles.message}>{message}</DSText>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <DSButton title={cancelLabel ?? t('confirm.cancel')} onPress={onCancel} disabled={isBusy} />
            </View>
            <Pressable
              style={[styles.actionItem, styles.confirmButton, isBusy ? styles.confirmButtonDisabled : null]}
              onPress={onConfirm}
              disabled={isBusy}
              testID={testID ? `${testID}-confirm` : undefined}
            >
              <DSText style={styles.confirmButtonText}>{isBusy ? (busyConfirmLabel ?? t('portfolio.deleteModalBusy')) : confirmLabel}</DSText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(8, 20, 40, 0.58)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E2EE',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 22px 44px rgba(12, 36, 74, 0.2)' as never },
      default: {},
    }),
  },
  headlineWrap: {
    gap: theme.spacing.sm,
  },
  title: {
    color: '#102A52',
    fontWeight: '800',
    fontSize: 22,
  },
  message: {
    color: '#42556F',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionItem: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  confirmButton: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#8D1F2A',
    backgroundColor: '#B62C3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
});
