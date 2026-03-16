import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { UserHolding } from '@/src/services/portfolio';
import { calculateRebalance, RebalanceOrder } from '@/src/services/rebalance';
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

const MOBILE_BREAKPOINT = 640;

function getDesktopDrawerWidth(step: 1 | 2 | 3, screenWidth: number): number {
  const boundedWidth = Math.min(screenWidth, 1024);

  if (screenWidth < 500) {
    return boundedWidth;
  }

  if (screenWidth < 1024) {
    if (step === 1) {
      return boundedWidth * 0.9;
    }
    if (step === 2) {
      return boundedWidth * 0.8;
    }
    return boundedWidth * 0.7;
  }

  if (step === 1) {
    return 600;
  }
  if (step === 2) {
    return 540;
  }
  return 480;
}

function getMobileDrawerHeight(step: 1 | 2 | 3, screenHeight: number): number {
  const boundedHeight = Math.max(screenHeight, 540);

  if (step === 1) {
    return Math.round(boundedHeight * 0.9);
  }
  if (step === 2) {
    return Math.round(boundedHeight * 0.85);
  }
  return Math.round(boundedHeight * 0.8);
}

type CascadingRebalanceFlowProps = {
  isOpen: boolean;
  onClose: () => void;
  screenWidth: number;
  holdings: UserHolding[];
  loadingHoldings: boolean;
};

export function CascadingRebalanceFlow({
  isOpen,
  onClose,
  screenWidth,
  holdings,
  loadingHoldings,
}: CascadingRebalanceFlowProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [deposit, setDeposit] = useState('');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RebalanceOrder[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const availableWidth = useMemo(() => Math.min(screenWidth, windowWidth), [screenWidth, windowWidth]);
  const isMobileLayout = windowWidth < MOBILE_BREAKPOINT;
  const animationDistance = useMemo(
    () => (isMobileLayout ? Math.max(windowHeight, 640) : Math.max(availableWidth, 1024)),
    [availableWidth, isMobileLayout, windowHeight],
  );
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const step1Translate = useRef(new Animated.Value(animationDistance)).current;
  const step2Translate = useRef(new Animated.Value(animationDistance)).current;
  const step3Translate = useRef(new Animated.Value(animationDistance)).current;
  const lastLayoutSignature = useRef<string>('');

  const drawerOneWidth = useMemo(
    () => (isMobileLayout ? availableWidth : getDesktopDrawerWidth(1, availableWidth)),
    [availableWidth, isMobileLayout],
  );
  const drawerTwoWidth = useMemo(
    () => (isMobileLayout ? availableWidth : getDesktopDrawerWidth(2, availableWidth)),
    [availableWidth, isMobileLayout],
  );
  const drawerThreeWidth = useMemo(
    () => (isMobileLayout ? availableWidth : getDesktopDrawerWidth(3, availableWidth)),
    [availableWidth, isMobileLayout],
  );

  const drawerOneHeight = useMemo(
    () => (isMobileLayout ? getMobileDrawerHeight(1, windowHeight) : undefined),
    [isMobileLayout, windowHeight],
  );
  const drawerTwoHeight = useMemo(
    () => (isMobileLayout ? getMobileDrawerHeight(2, windowHeight) : undefined),
    [isMobileLayout, windowHeight],
  );
  const drawerThreeHeight = useMemo(
    () => (isMobileLayout ? getMobileDrawerHeight(3, windowHeight) : undefined),
    [isMobileLayout, windowHeight],
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

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setCurrentStep(1);
      setRequestError(null);
      setOrders(null);

      step1Translate.setValue(animationDistance);
      step2Translate.setValue(animationDistance);
      step3Translate.setValue(animationDistance);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(step1Translate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isRendered) {
      return;
    }

    Animated.parallel([
      Animated.timing(step1Translate, {
        toValue: animationDistance,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(step2Translate, {
        toValue: animationDistance,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(step3Translate, {
        toValue: animationDistance,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRendered(false);
    });
  }, [
    animationDistance,
    backdropOpacity,
    isOpen,
    isRendered,
    step1Translate,
    step2Translate,
    step3Translate,
  ]);

  useEffect(() => {
    if (!isOpen || !isRendered) {
      return;
    }

    Animated.timing(step2Translate, {
      toValue: currentStep >= 2 ? 0 : animationDistance,
      duration: 300,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: true,
    }).start();
  }, [currentStep, animationDistance, isOpen, isRendered, step2Translate]);

  useEffect(() => {
    if (!isOpen || !isRendered) {
      return;
    }

    Animated.timing(step3Translate, {
      toValue: currentStep >= 3 ? 0 : animationDistance,
      duration: 300,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: true,
    }).start();
  }, [currentStep, animationDistance, isOpen, isRendered, step3Translate]);

  useEffect(() => {
    const layoutSignature = `${isMobileLayout ? 'mobile' : 'desktop'}-${animationDistance}`;
    if (layoutSignature === lastLayoutSignature.current) {
      return;
    }
    lastLayoutSignature.current = layoutSignature;

    if (!isRendered) {
      return;
    }

    if (!isOpen) {
      return;
    }

    // Keep drawer positions coherent when crossing mobile/desktop breakpoints.
    step1Translate.setValue(0);
    step2Translate.setValue(currentStep >= 2 ? 0 : animationDistance);
    step3Translate.setValue(currentStep >= 3 ? 0 : animationDistance);
    backdropOpacity.setValue(1);
  }, [animationDistance, backdropOpacity, currentStep, isOpen, isRendered, isMobileLayout, step1Translate, step2Translate, step3Translate]);

  useEffect(() => {
    if (!isOpen || targetTickers.length === 0) {
      return;
    }

    const equalWeight = (100 / targetTickers.length).toFixed(2);
    const seededTargets: Record<string, string> = {};
    targetTickers.forEach((ticker) => {
      seededTargets[ticker] = equalWeight;
    });
    setTargets(seededTargets);
  }, [isOpen, targetTickers]);

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

  const getDrawerTransform = (value: Animated.Value) => {
    return isMobileLayout ? [{ translateY: value }] : [{ translateX: value }];
  };

  if (!isRendered) {
    return null;
  }

  return (
    <View style={styles.flowRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 20, opacity: backdropOpacity },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.drawerLayer} pointerEvents="box-none">
        <Animated.View
          testID="rebalance-step-1-drawer"
          style={[
            styles.drawerBase,
            isMobileLayout ? styles.mobileDrawerBase : styles.desktopDrawerBase,
            isMobileLayout ? styles.cascadeShadowTop : styles.cascadeShadowLeft,
            {
              width: drawerOneWidth,
              height: drawerOneHeight ?? '100%',
              zIndex: 30,
              transform: getDrawerTransform(step1Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>Passo 1: Valor do Aporte (R$)</DSText>
            <DSInput
              label="Aporte"
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="numeric"
              placeholder="Ex.: 1000"
            />
            {requestError && currentStep === 1 ? <DSText style={styles.error}>{requestError}</DSText> : null}
            <View style={styles.drawerActionsRow}>
              <DSButton title="Fechar" onPress={onClose} />
              <DSButton title="Continuar" onPress={() => setCurrentStep(2)} testID="rebalance-step-1-continue" />
            </View>
          </ScrollView>
        </Animated.View>

        <Animated.View
          testID="rebalance-step-2-drawer"
          style={[
            styles.drawerBase,
            isMobileLayout ? styles.mobileDrawerBase : styles.desktopDrawerBase,
            isMobileLayout ? styles.cascadeShadowTop : styles.cascadeShadowLeft,
            {
              width: drawerTwoWidth,
              height: drawerTwoHeight ?? '100%',
              zIndex: 31,
              transform: getDrawerTransform(step2Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>Passo 2: Percentual alvo</DSText>
            {loadingHoldings ? <DSText style={styles.emptyHint}>Carregando ativos...</DSText> : null}
            {!loadingHoldings && targetTickers.length === 0 ? (
              <DSText style={styles.emptyHint}>Nenhum ativo disponivel para configurar alvo.</DSText>
            ) : null}
            {targetTickers.map((ticker) => (
              <DSInput
                key={ticker}
                label={`${ticker} (% alvo)`}
                value={targets[ticker] ?? ''}
                onChangeText={(value) =>
                  setTargets((previous) => ({
                    ...previous,
                    [ticker]: value,
                  }))
                }
                keyboardType="numeric"
              />
            ))}
            <View style={styles.totalRow}>
              <DSText style={styles.totalLabel}>Soma dos percentuais</DSText>
              <DSText
                style={[
                  styles.totalValue,
                  Math.abs(totalTarget - 100) > 0.01 ? styles.totalInvalid : null,
                ]}
              >
                {totalTarget.toFixed(2)}%
              </DSText>
            </View>
            <View style={styles.drawerActionsRow}>
              <DSButton title="Voltar" onPress={() => setCurrentStep(1)} />
              <DSButton title="Continuar" onPress={() => setCurrentStep(3)} testID="rebalance-step-2-continue" />
            </View>
          </ScrollView>
        </Animated.View>

        <Animated.View
          testID="rebalance-step-3-drawer"
          style={[
            styles.drawerBase,
            isMobileLayout ? styles.mobileDrawerBase : styles.desktopDrawerBase,
            isMobileLayout ? styles.cascadeShadowTop : styles.cascadeShadowLeft,
            {
              width: drawerThreeWidth,
              height: drawerThreeHeight ?? '100%',
              zIndex: 32,
              transform: getDrawerTransform(step3Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>Passo 3: Boleta Inteligente</DSText>
            <DSButton
              title={isCalculating ? 'Calculando...' : 'Calcular'}
              onPress={() => void onCalculate()}
              disabled={isCalculating}
            />
            {requestError && currentStep === 3 ? <DSText style={styles.error}>{requestError}</DSText> : null}
            {orders ? (
              <View style={styles.resultsWrapper}>
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
                              order.action === 'BUY'
                                ? styles.buy
                                : order.action === 'SELL'
                                  ? styles.sell
                                  : styles.hold,
                            ]}
                          >
                            {order.action}
                          </DSText>
                          <DSText style={styles.orderValue}>
                            {currencyFormatter.format(order.estimatedValue)}
                          </DSText>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.drawerActionsRow}>
              <DSButton title="Voltar" onPress={() => setCurrentStep(2)} />
              <DSButton title="Fechar" onPress={onClose} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flowRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerBase: {
    position: 'absolute',
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  desktopDrawerBase: {
    right: 0,
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  mobileDrawerBase: {
    right: 0,
    left: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cascadeShadowLeft: {
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.15,
    elevation: 10,
  },
  cascadeShadowTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    elevation: 10,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    padding: 24,
    gap: theme.spacing.sm,
    paddingBottom: 24,
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
  drawerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  emptyHint: {
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  resultsWrapper: {
    gap: 8,
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
