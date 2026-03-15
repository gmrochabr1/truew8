import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DSText } from '@/src/components/common/DSText';
import { theme } from '@/src/theme/tokens';

type RebalanceWizardModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectQuickDeposit: () => void;
  onSelectSyncPortfolio: () => void;
};

export function RebalanceWizardModal({
  visible,
  onClose,
  onSelectQuickDeposit,
  onSelectSyncPortfolio,
}: RebalanceWizardModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <DSText variant="subtitle">Qual a sua estrategia hoje?</DSText>

          <Pressable
            testID="strategy-quick-deposit"
            style={styles.optionCard}
            onPress={onSelectQuickDeposit}
          >
            <DSText style={styles.icon}>RAIO</DSText>
            <View style={styles.optionBody}>
              <DSText variant="label">Aporte Rapido</DSText>
              <DSText variant="caption">Distribua um novo aporte na sua carteira atual.</DSText>
            </View>
          </Pressable>

          <Pressable
            testID="strategy-sync-portfolio"
            style={styles.optionCard}
            onPress={onSelectSyncPortfolio}
          >
            <DSText style={styles.icon}>ALVO</DSText>
            <View style={styles.optionBody}>
              <DSText variant="label">Sincronizar Carteiras</DSText>
              <DSText variant="caption">Siga carteiras recomendadas fazendo upload de prints.</DSText>
            </View>
          </Pressable>
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
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(20, 33, 61, 0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 22px 60px rgba(20,33,61,0.2)' as never },
      default: {},
    }),
  },
  optionCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  optionBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  icon: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    color: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    minWidth: 44,
    textAlign: 'center',
    paddingVertical: 3,
  },
});
