import React, { useCallback, useMemo, useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { getPortfolioHoldings, UserHolding } from '@/src/services/portfolio';
import { calculateRebalance, RebalanceOrder } from '@/src/services/rebalance';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

function roundToFour(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export default function RebalanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const portfolioId = String(id ?? '');
  const { isAuthenticated, isLoading } = useAuth();

  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [deposit, setDeposit] = useState('');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RebalanceOrder[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const loadHoldings = useCallback(async () => {
    try {
      setLoadingHoldings(true);
      setRequestError(null);
      const response = await getPortfolioHoldings(portfolioId);
      setHoldings(response);

      const uniqueTickers = Array.from(new Set(response.map((holding) => holding.ticker)));
      if (uniqueTickers.length > 0) {
        const equalWeight = (100 / uniqueTickers.length).toFixed(2);
        const seededTargets: Record<string, string> = {};
        uniqueTickers.forEach((ticker) => {
          seededTargets[ticker] = equalWeight;
        });
        setTargets(seededTargets);
      }
    } catch {
      setRequestError('Nao foi possivel carregar os dados da carteira para rebalancear.');
    } finally {
      setLoadingHoldings(false);
    }
  }, [portfolioId]);

  useFocusEffect(
    useCallback(() => {
      void loadHoldings();
    }, [loadHoldings]),
  );

  const tickerPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((holding) => {
      if (!map.has(holding.ticker)) {
        map.set(holding.ticker, holding.averagePrice);
      }
    });
    return map;
  }, [holdings]);

  const tickerBrokerageMap = useMemo(() => {
    const map = new Map<string, string>();
    holdings.forEach((holding) => {
      if (!map.has(holding.ticker) && holding.brokerage) {
        map.set(holding.ticker, holding.brokerage);
      }
    });
    return map;
  }, [holdings]);

  const targetTickers = useMemo(() => Array.from(tickerPriceMap.keys()), [tickerPriceMap]);

  const totalTarget = useMemo(() => {
    return targetTickers.reduce((sum, ticker) => sum + parseDecimal(targets[ticker] ?? '0'), 0);
  }, [targetTickers, targets]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, RebalanceOrder[]> = {};
    (orders ?? []).forEach((order) => {
      const key = order.brokerage?.trim() ? order.brokerage : 'Sem corretora';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return groups;
  }, [orders]);

  if (isLoading) {
    return <AuthLoadingScreen message="Validando sessao..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!portfolioId) {
    return <Redirect href={'/dashboard' as never} />;
  }

  const onCalculate = async () => {
    setRequestError(null);
    setOrders(null);

    const parsedDeposit = parseDecimal(deposit);
    if (parsedDeposit < 0) {
      setRequestError('O valor do aporte deve ser maior ou igual a zero.');
      return;
    }

    const percentDelta = Math.abs(totalTarget - 100);
    if (percentDelta > 0.01) {
      setRequestError('A soma dos percentuais alvo deve ser exatamente 100%.');
      return;
    }

    const targetPortfolio = targetTickers.map((ticker) => {
      const percent = parseDecimal(targets[ticker] ?? '0');
      return {
        ticker,
        percentage: roundToFour(percent / 100),
        price: tickerPriceMap.get(ticker) ?? 1,
        brokerage: tickerBrokerageMap.get(ticker) ?? null,
      };
    });

    if (targetPortfolio.length === 0) {
      setRequestError('Adicione ao menos um ativo para calcular o rebalanceamento.');
      return;
    }

    setIsCalculating(true);
    try {
      const response = await calculateRebalance({
        newDeposit: parsedDeposit,
        currentHoldings: holdings.map((holding) => ({
          ticker: holding.ticker,
          quantity: holding.quantity,
          price: holding.averagePrice,
          brokerage: holding.brokerage,
        })),
        targetPortfolio,
      });
      setOrders(response.orders ?? []);
    } catch {
      setRequestError('Nao foi possivel calcular o rebalanceamento agora.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.stepCard}>
        <DSText style={styles.stepTitle}>Passo 1: Valor do Aporte (R$)</DSText>
        <DSInput
          label="Aporte"
          value={deposit}
          onChangeText={setDeposit}
          keyboardType="numeric"
          placeholder="Ex.: 1000"
          testID="rebalance-deposit-input"
        />
      </View>

      <View style={styles.stepCard}>
        <DSText style={styles.stepTitle}>Passo 2: Percentual alvo por ativo</DSText>
        {loadingHoldings ? <DSText>Carregando ativos...</DSText> : null}

        {targetTickers.map((ticker) => (
          <DSInput
            key={ticker}
            label={`${ticker} (% alvo)`}
            value={targets[ticker] ?? ''}
            onChangeText={(value) => {
              setTargets((previous) => ({ ...previous, [ticker]: value }));
            }}
            keyboardType="numeric"
            testID={`rebalance-target-${ticker}`}
          />
        ))}

        <View style={styles.totalRow}>
          <DSText style={styles.totalLabel}>Soma dos percentuais</DSText>
          <DSText style={[styles.totalValue, Math.abs(totalTarget - 100) > 0.01 ? styles.totalInvalid : null]}>
            {totalTarget.toFixed(2)}%
          </DSText>
        </View>
      </View>

      <View style={styles.stepCard}>
        <DSText style={styles.stepTitle}>Passo 3: Calcular</DSText>
        <DSButton title={isCalculating ? 'Calculando...' : 'Calcular'} onPress={() => void onCalculate()} testID="rebalance-calculate-button" />
      </View>

      {requestError ? <DSText style={styles.error}>{requestError}</DSText> : null}

      {orders ? (
        <View style={styles.stepCard}>
          <DSText style={styles.stepTitle}>Passo 4: Boleta agrupada por corretora</DSText>

          {Object.entries(groupedOrders).map(([brokerage, grouped]) => (
            <View key={brokerage} style={styles.brokerageGroup}>
              <DSText style={styles.brokerageTitle}>{brokerage}</DSText>
              {grouped.map((order, index) => (
                <View key={`${brokerage}-${order.ticker}-${index}`} style={styles.orderRow}>
                  <View>
                    <DSText style={styles.orderTicker}>{order.ticker}</DSText>
                    <DSText style={styles.orderMeta}>Qtd: {order.quantity}</DSText>
                  </View>
                  <View style={styles.orderRight}>
                    <DSText
                      style={[
                        styles.orderAction,
                        order.action === 'BUY' ? styles.buy : null,
                        order.action === 'SELL' ? styles.sell : null,
                        order.action === 'HOLD' ? styles.hold : null,
                      ]}
                    >
                      {order.action}
                    </DSText>
                    <DSText style={styles.orderValue}>{currencyFormatter.format(order.estimatedValue)}</DSText>
                  </View>
                </View>
              ))}
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
    paddingBottom: 24,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  totalRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: theme.colors.textMuted,
  },
  totalValue: {
    color: theme.colors.emerald,
    fontWeight: '800',
  },
  totalInvalid: {
    color: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  brokerageGroup: {
    borderWidth: 1,
    borderColor: '#D7E1EE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  brokerageTitle: {
    backgroundColor: '#EEF4FC',
    color: theme.colors.primary,
    fontWeight: '800',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EBF0F7',
  },
  orderTicker: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  orderMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderAction: {
    fontWeight: '800',
  },
  buy: {
    color: theme.colors.emerald,
  },
  sell: {
    color: theme.colors.danger,
  },
  hold: {
    color: theme.colors.hold,
  },
  orderValue: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
});
