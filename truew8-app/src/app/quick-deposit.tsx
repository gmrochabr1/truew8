import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { useAuth } from '@/src/store/AuthContext';
import { usePortfolio } from '@/src/store/PortfolioContext';
import { theme } from '@/src/theme/tokens';

const parseNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function QuickDepositScreen() {
  const { isLoading, isAuthenticated } = useAuth();
  const { unlockedAssets } = usePortfolio();
  const [deposit, setDeposit] = useState('5000');
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    unlockedAssets.reduce<Record<string, string>>((acc, asset) => {
      acc[asset.ticker] = '';
      return acc;
    }, {}),
  );

  const totalTarget = useMemo(() => {
    return unlockedAssets.reduce((sum, asset) => sum + parseNumber(targets[asset.ticker] ?? ''), 0);
  }, [targets, unlockedAssets]);

  const isBalanced = Math.abs(totalTarget - 100) < 0.01;

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.depositCard}>
        <DSText variant="caption">Fluxo A - Autonomo</DSText>
        <DSInput
          label="Novo Aporte (R$)"
          value={deposit}
          onChangeText={setDeposit}
          keyboardType="numeric"
          testID="quick-deposit-input"
        />
      </View>

      <View style={styles.counterBox}>
        <DSText variant="label">Distribuicao dos percentuais</DSText>
        <DSText
          variant="subtitle"
          style={isBalanced ? styles.counterSuccess : styles.counterDanger}
          testID="quick-deposit-total-target"
        >
          {`${totalTarget.toFixed(2)}%`}
        </DSText>
      </View>

      <View style={styles.panel}>
        <DSText variant="subtitle">Ativos disponiveis para rebalanceamento</DSText>

        {unlockedAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <DSText variant="body">Nenhum ativo desbloqueado no Dashboard.</DSText>
            <DSButton title="Voltar ao Dashboard" onPress={() => router.replace('/')} testID="back-to-dashboard" />
          </View>
        ) : (
          unlockedAssets.map((asset) => (
            <View key={asset.id} style={styles.assetRow}>
              <View style={styles.assetInfo}>
                <DSText variant="label">{asset.ticker}</DSText>
                <DSText variant="caption">Custodia: {asset.quantity} cotas</DSText>
              </View>
              <View style={styles.assetInputWrap}>
                <DSInput
                  label="% Alvo"
                  value={targets[asset.ticker] ?? ''}
                  onChangeText={(value) => setTargets((previous) => ({ ...previous, [asset.ticker]: value }))}
                  keyboardType="numeric"
                  testID={`quick-target-${asset.ticker}`}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <DSButton
        title="Gerar Ordens"
        onPress={() => router.replace('/')}
        disabled={!isBalanced || unlockedAssets.length === 0}
        testID="quick-generate-orders"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  depositCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9ddd0',
    backgroundColor: '#f1f3eb',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  counterBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  counterSuccess: {
    color: theme.colors.success,
  },
  counterDanger: {
    color: theme.colors.danger,
  },
  panel: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyState: {
    gap: theme.spacing.sm,
  },
  assetRow: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#e3e8ea',
    backgroundColor: '#fbfbf9',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    flexDirection: 'row',
  },
  assetInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  assetInputWrap: {
    width: 120,
  },
});
