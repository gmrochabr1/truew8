import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSText } from '@/src/components/common/DSText';
import { RebalanceWizardModal } from '@/src/components/rebalance/RebalanceWizardModal';
import { useAuth } from '@/src/store/AuthContext';
import { usePortfolio } from '@/src/store/PortfolioContext';
import { theme } from '@/src/theme/tokens';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function DashboardScreen() {
  const { email, isLoading, isAuthenticated, logout } = useAuth();
  const { assets, totalPatrimony, toggleAssetLock } = usePortfolio();
  const [wizardVisible, setWizardVisible] = useState(false);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sessionHeader}>
          <View>
            <DSText variant="caption">Sessao ativa para</DSText>
            <DSText testID="dashboard-user-email" variant="label">{email ?? '-'}</DSText>
          </View>
          <DSButton
            title="Terminar sessao"
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            testID="button-logout"
          />
        </View>

        <View style={styles.patrimonyCard}>
          <DSText variant="caption">Patrimonio Total</DSText>
          <DSText variant="title" testID="dashboard-total-patrimony">{formatCurrency(totalPatrimony)}</DSText>
        </View>

        <View style={styles.tablePanel}>
          <View style={styles.tableHeader}>
            <DSText style={styles.tableHeaderCell}>Ativo</DSText>
            <DSText style={styles.tableHeaderCell}>Qtd</DSText>
            <DSText style={styles.tableHeaderCell}>Preco</DSText>
            <DSText style={styles.tableHeaderCell}>Valor</DSText>
            <DSText style={[styles.tableHeaderCell, styles.lockHeader]}>Cofre</DSText>
          </View>

          {assets.map((asset) => {
            const rowValue = asset.quantity * asset.avgPrice;
            return (
              <View
                key={asset.id}
                style={[styles.tableRow, asset.locked ? styles.tableRowLocked : null]}
                testID={`custody-row-${asset.ticker}`}
              >
                <DSText style={styles.tableCell}>{asset.ticker}</DSText>
                <DSText style={styles.tableCell}>{String(asset.quantity)}</DSText>
                <DSText style={styles.tableCell}>{formatCurrency(asset.avgPrice)}</DSText>
                <DSText style={styles.tableCell}>{formatCurrency(rowValue)}</DSText>
                <View style={styles.lockCell}>
                  <Switch
                    testID={`lock-toggle-${asset.ticker}`}
                    value={asset.locked}
                    onValueChange={() => toggleAssetLock(asset.id)}
                    trackColor={{ false: '#9bbec3', true: '#8d99ae' }}
                    thumbColor={asset.locked ? '#495057' : '#ffffff'}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <DSButton
          title="Rebalancear Carteira"
          onPress={() => setWizardVisible(true)}
          testID="open-rebalance-wizard"
        />
      </View>

      <RebalanceWizardModal
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onSelectQuickDeposit={() => {
          setWizardVisible(false);
          router.push('/quick-deposit');
        }}
        onSelectSyncPortfolio={() => {
          setWizardVisible(false);
          router.push('/sync-portfolio');
        }}
      />
    </View>
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
    paddingBottom: 110,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  patrimonyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ddcf',
    backgroundColor: '#eef2e8',
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  tablePanel: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8ecef',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  lockHeader: {
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
  },
  tableRowLocked: {
    opacity: 0.55,
    backgroundColor: '#f0f2eb',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  lockCell: {
    flex: 1,
    alignItems: 'center',
  },
  ctaWrap: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    ...Platform.select({
      web: { maxWidth: 440, alignSelf: 'center' as const },
      default: {},
    }),
  },
});
