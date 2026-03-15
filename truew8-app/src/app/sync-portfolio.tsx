import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

type UploadedPortfolio = {
  id: string;
  name: string;
  stocks: string;
};

const parseNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const mockedUploadedPortfolios: UploadedPortfolio[] = [
  { id: 'portfolio-1', name: 'Carteira Top Dividendos', stocks: 'ITSA4, BBAS3, TAEE11' },
  { id: 'portfolio-2', name: 'Carteira Crescimento BR', stocks: 'WEGE3, RENT3, LREN3' },
];

export default function SyncPortfolioScreen() {
  const { isLoading, isAuthenticated } = useAuth();
  const [hasUploaded, setHasUploaded] = useState(true);
  const [weights, setWeights] = useState<Record<string, string>>({
    'portfolio-1': '60',
    'portfolio-2': '40',
  });

  const totalWeight = useMemo(() => {
    return mockedUploadedPortfolios.reduce((sum, portfolio) => sum + parseNumber(weights[portfolio.id] ?? ''), 0);
  }, [weights]);

  const isValidWeight = Math.abs(totalWeight - 100) < 0.01;

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.uploadPanel}>
        <DSText variant="subtitle">Fluxo B - Seguidor</DSText>
        <DSText variant="caption">Combine carteiras recomendadas e execute um rebalanceamento guiado.</DSText>
        <DSButton
          title="Fazer Upload do Print (Carteira Recomendada)"
          onPress={() => setHasUploaded(true)}
          testID="sync-upload-print"
        />
      </View>

      {hasUploaded ? (
        <View style={styles.portfolioPanel}>
          <DSText variant="label">Carteiras detectadas (mock)</DSText>

          {mockedUploadedPortfolios.map((portfolio) => (
            <View key={portfolio.id} style={styles.portfolioRow}>
              <View style={styles.portfolioInfo}>
                <DSText variant="body">{portfolio.name}</DSText>
                <DSText variant="caption">{portfolio.stocks}</DSText>
              </View>
              <View style={styles.weightInputWrap}>
                <DSInput
                  label="Peso (%)"
                  value={weights[portfolio.id] ?? ''}
                  onChangeText={(value) => setWeights((previous) => ({ ...previous, [portfolio.id]: value }))}
                  keyboardType="numeric"
                  testID={`sync-weight-${portfolio.id}`}
                />
              </View>
            </View>
          ))}

          <View style={styles.weightTotalBox}>
            <DSText variant="label">Peso consolidado</DSText>
            <DSText
              variant="subtitle"
              style={isValidWeight ? styles.totalSuccess : styles.totalDanger}
              testID="sync-total-weight"
            >
              {`${totalWeight.toFixed(2)}%`}
            </DSText>
          </View>
        </View>
      ) : null}

      <DSButton
        title="Processar e Rebalancear"
        onPress={() => router.replace('/')}
        disabled={!hasUploaded || !isValidWeight}
        testID="sync-process-rebalance"
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
  uploadPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d2dae4',
    backgroundColor: '#ecf2f8',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  portfolioPanel: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  portfolioRow: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8ee',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    flexDirection: 'row',
    backgroundColor: '#f8fbfe',
  },
  portfolioInfo: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  weightInputWrap: {
    width: 120,
  },
  weightTotalBox: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#f7f7f3',
  },
  totalSuccess: {
    color: theme.colors.success,
  },
  totalDanger: {
    color: theme.colors.danger,
  },
});
