import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { t } from '@/src/i18n';
import { calculateRebalance, RebalanceOrder } from '@/src/services/rebalance';
import { theme } from '@/src/theme/tokens';

type HoldingRow = { ticker: string; quantity: string; price: string };
type TargetRow = { ticker: string; percentage: string; price: string };

const toNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function RebalanceScreen() {
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

  const submit = async () => {
    setError('');
    try {
      const response = await calculateRebalance({
        newDeposit: toNumber(newDeposit),
        currentHoldings: holdings.map((holding) => ({
          ticker: holding.ticker,
          quantity: toNumber(holding.quantity),
          price: toNumber(holding.price),
        })),
        targetPortfolio: targets.map((target) => ({
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
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
