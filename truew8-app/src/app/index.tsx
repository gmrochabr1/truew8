import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { t } from '@/src/i18n';
import { extractHoldingsFromPrint } from '@/src/services/ocr';
import { calculateRebalance, RebalanceOrder } from '@/src/services/rebalance';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

type HoldingRow = { ticker: string; quantity: string; price: string };
type TargetRow = { ticker: string; percentage: string; price: string };

const toNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function RebalanceScreen() {
  const { email, isLoading, isAuthenticated, logout } = useAuth();
  const [newDeposit, setNewDeposit] = useState('1000');
  const [holdings, setHoldings] = useState<HoldingRow[]>([
    { ticker: 'PETR4', quantity: '100', price: '30' },
  ]);
  const [targets, setTargets] = useState<TargetRow[]>([
    { ticker: 'PETR4', percentage: '0.5', price: '30' },
    { ticker: 'VALE3', percentage: '0.5', price: '50' },
  ]);
  const [orders, setOrders] = useState<RebalanceOrder[]>([]);
  const [error, setError] = useState('');
  const [isImportingPrint, setIsImportingPrint] = useState(false);

  const mappedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      actionLabel:
        order.action === 'BUY'
          ? t('rebalance.buy')
          : order.action === 'SELL'
            ? t('rebalance.sell')
            : t('rebalance.hold'),
    }));
  }, [orders]);

  const updateHolding = (index: number, key: keyof HoldingRow, value: string) => {
    setHoldings((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const updateTarget = (index: number, key: keyof TargetRow, value: string) => {
    setTargets((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const addHolding = () => {
    setHoldings((previous) => [...previous, { ticker: '', quantity: '', price: '' }]);
  };

  const addTarget = () => {
    setTargets((previous) => [...previous, { ticker: '', percentage: '', price: '' }]);
  };

  const formatQuantity = (quantity: number): string => {
    return Number.isInteger(quantity) ? String(quantity) : quantity.toString();
  };

  const importFromPrint = async () => {
    if (isImportingPrint) {
      return;
    }

    setError('');
    setIsImportingPrint(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(t('rebalance.importError'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const extracted = await extractHoldingsFromPrint({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });

      if (extracted.length === 0) {
        setError(t('rebalance.importNoData'));
        return;
      }

      const knownPrices = new Map<string, string>();
      for (const holding of holdings) {
        knownPrices.set(holding.ticker.trim().toUpperCase(), holding.price);
      }
      for (const target of targets) {
        if (!knownPrices.has(target.ticker.trim().toUpperCase())) {
          knownPrices.set(target.ticker.trim().toUpperCase(), target.price);
        }
      }

      setHoldings(
        extracted.map((holding) => {
          const ticker = holding.ticker.trim().toUpperCase();
          return {
            ticker,
            quantity: formatQuantity(holding.quantity),
            price: knownPrices.get(ticker) ?? '',
          };
        }),
      );
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 403) {
        setError(t('rebalance.importLimitReached'));
      } else {
        setError(t('rebalance.importError'));
      }
    } finally {
      setIsImportingPrint(false);
    }
  };

  const submit = async () => {
    setError('');
    const sanitizedHoldings = holdings.filter((holding) => holding.ticker.trim().length > 0);
    const sanitizedTargets = targets.filter((target) => target.ticker.trim().length > 0);

    try {
      const response = await calculateRebalance({
        newDeposit: toNumber(newDeposit),
        currentHoldings: sanitizedHoldings.map((holding) => ({
          ticker: holding.ticker,
          quantity: toNumber(holding.quantity),
          price: toNumber(holding.price),
        })),
        targetPortfolio: sanitizedTargets.map((target) => ({
          ticker: target.ticker,
          percentage: toNumber(target.percentage),
          price: toNumber(target.price),
        })),
      });

      setOrders(response.orders);
    } catch (_e) {
      setError(t('rebalance.error'));
      setOrders([]);
    }
  };

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.sessionHeader}>
        <View>
          <Text style={styles.sessionLabel}>{t('dashboard.welcome')}</Text>
          <Text testID="dashboard-user-email" style={styles.sessionEmail}>{email ?? '-'}</Text>
        </View>
        <DSButton
          title={t('auth.logout')}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          testID="button-logout"
        />
      </View>

      <Text style={styles.title}>{t('rebalance.screenTitle')}</Text>

      <DSInput
        testID="input-deposit"
        label={t('rebalance.depositLabel')}
        value={newDeposit}
        onChangeText={setNewDeposit}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>{t('rebalance.holdingsTitle')}</Text>
      {holdings.map((holding, index) => (
        <View key={`holding-${index}`} style={styles.row}>
          <DSInput
            testID={`holding-ticker-${index}`}
            label={t('rebalance.ticker')}
            value={holding.ticker}
            onChangeText={(value) => updateHolding(index, 'ticker', value)}
          />
          <DSInput
            testID={`holding-quantity-${index}`}
            label={t('rebalance.quantity')}
            value={holding.quantity}
            keyboardType="numeric"
            onChangeText={(value) => updateHolding(index, 'quantity', value)}
          />
          <DSInput
            testID={`holding-price-${index}`}
            label={t('rebalance.price')}
            value={holding.price}
            keyboardType="numeric"
            onChangeText={(value) => updateHolding(index, 'price', value)}
          />
        </View>
      ))}
      <DSButton title={t('rebalance.addHolding')} onPress={addHolding} testID="button-add-holding" />
      <DSButton
        title={isImportingPrint ? t('rebalance.importingPrint') : t('rebalance.importFromPrint')}
        onPress={importFromPrint}
        testID="button-import-print"
      />

      <Text style={styles.sectionTitle}>{t('rebalance.targetTitle')}</Text>
      {targets.map((target, index) => (
        <View key={`target-${index}`} style={styles.row}>
          <DSInput
            testID={`target-ticker-${index}`}
            label={t('rebalance.ticker')}
            value={target.ticker}
            onChangeText={(value) => updateTarget(index, 'ticker', value)}
          />
          <DSInput
            testID={`target-percentage-${index}`}
            label={t('rebalance.percentage')}
            value={target.percentage}
            keyboardType="numeric"
            onChangeText={(value) => updateTarget(index, 'percentage', value)}
          />
          <DSInput
            testID={`target-price-${index}`}
            label={t('rebalance.price')}
            value={target.price}
            keyboardType="numeric"
            onChangeText={(value) => updateTarget(index, 'price', value)}
          />
        </View>
      ))}
      <DSButton title={t('rebalance.addTarget')} onPress={addTarget} testID="button-add-target" />

      <DSButton title={t('rebalance.submit')} onPress={submit} testID="button-submit-rebalance" />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {mappedOrders.length > 0 ? (
        <View style={styles.resultsWrapper} testID="rebalance-results-table">
          <Text style={styles.sectionTitle}>{t('rebalance.resultsTitle')}</Text>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.headerCell}>{t('rebalance.action')}</Text>
            <Text style={styles.headerCell}>{t('rebalance.ticker')}</Text>
            <Text style={styles.headerCell}>{t('rebalance.quantity')}</Text>
            <Text style={styles.headerCell}>{t('rebalance.estimatedValue')}</Text>
          </View>
          {mappedOrders.map((order, index) => (
            <View key={`${order.ticker}-${index}`} style={[styles.tableRow, index % 2 === 1 ? styles.altRow : null]}>
              <Text style={styles.cell}>{order.actionLabel}</Text>
              <Text style={styles.cell}>{order.ticker}</Text>
              <Text style={styles.cell}>{String(order.quantity)}</Text>
              <Text style={styles.cell}>{String(order.estimatedValue)}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  sessionLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sessionEmail: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  resultsWrapper: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  altRow: {
    backgroundColor: theme.colors.rowAlt,
  },
  headerCell: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  cell: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 12,
  },
});
