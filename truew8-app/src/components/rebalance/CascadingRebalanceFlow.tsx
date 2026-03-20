import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { getDecimalSeparator, parseLocaleNumber } from '@/src/services/numericInput';
import { UserHolding } from '@/src/services/portfolio';
import { calculateRebalance, RebalanceOrder } from '@/src/services/rebalance';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

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
  const visibleTopGap = 72;
  const maxHeight = Math.max(screenHeight - visibleTopGap, 320);
  if (step === 1) {
    return Math.min(Math.round(screenHeight * 0.78), maxHeight);
  }
  if (step === 2) {
    return Math.min(Math.round(screenHeight * 0.72), maxHeight);
  }
  return Math.min(Math.round(screenHeight * 0.66), maxHeight);
}

function getDrawerHeight(step: 1 | 2 | 3, screenHeight: number, isMobileLayout: boolean): number {
  if (isMobileLayout) {
    return getMobileDrawerHeight(step, screenHeight);
  }

  const visibleTopGap = 96;
  const maxHeight = Math.max(screenHeight - visibleTopGap, 380);
  if (step === 1) {
    return Math.min(Math.round(screenHeight * 0.8), maxHeight);
  }
  if (step === 2) {
    return Math.min(Math.round(screenHeight * 0.74), maxHeight);
  }
  return Math.min(Math.round(screenHeight * 0.68), maxHeight);
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
  const { t, locale, formatCurrency, formatNumber } = useLocale();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [deposit, setDeposit] = useState('');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RebalanceOrder[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const numberLocale = locale === 'en-US' ? 'en-US' : 'pt-BR';

  const availableWidth = useMemo(() => Math.min(screenWidth, windowWidth), [screenWidth, windowWidth]);
  const isMobileLayout = windowWidth < MOBILE_BREAKPOINT;
  const animationDistance = useMemo(() => Math.max(windowHeight, 640), [windowHeight]);
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
    () => getDrawerHeight(1, windowHeight, isMobileLayout),
    [isMobileLayout, windowHeight],
  );
  const drawerTwoHeight = useMemo(
    () => getDrawerHeight(2, windowHeight, isMobileLayout),
    [isMobileLayout, windowHeight],
  );
  const drawerThreeHeight = useMemo(
    () => getDrawerHeight(3, windowHeight, isMobileLayout),
    [isMobileLayout, windowHeight],
  );

  const drawerOneTopInset = useMemo(
    () => Math.max(windowHeight - drawerOneHeight, 56),
    [drawerOneHeight, windowHeight],
  );
  const drawerTwoTopInset = useMemo(
    () => Math.max(windowHeight - drawerTwoHeight, 56),
    [drawerTwoHeight, windowHeight],
  );
  const drawerThreeTopInset = useMemo(
    () => Math.max(windowHeight - drawerThreeHeight, 56),
    [drawerThreeHeight, windowHeight],
  );

  const drawerOneLeftInset = useMemo(() => Math.max((availableWidth - drawerOneWidth) / 2, 0), [availableWidth, drawerOneWidth]);
  const drawerTwoLeftInset = useMemo(() => Math.max((availableWidth - drawerTwoWidth) / 2, 0), [availableWidth, drawerTwoWidth]);
  const drawerThreeLeftInset = useMemo(
    () => Math.max((availableWidth - drawerThreeWidth) / 2, 0),
    [availableWidth, drawerThreeWidth],
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
  const lockedTickers = useMemo(() => {
    const locked = new Set<string>();
    holdings.forEach((holding) => {
      if (holding.isLocked) {
        locked.add(holding.ticker);
      }
    });
    return locked;
  }, [holdings]);

  const unlockedTargetTickers = useMemo(
    () => targetTickers.filter((ticker) => !lockedTickers.has(ticker)),
    [lockedTickers, targetTickers],
  );

  const totalTarget = useMemo(() => {
    return unlockedTargetTickers.reduce((sum, ticker) => sum + parseLocaleNumber(targets[ticker] ?? '0', numberLocale), 0);
  }, [numberLocale, targets, unlockedTargetTickers]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, RebalanceOrder[]> = {};
    (orders ?? []).forEach((order) => {
      const key = order.brokerage?.trim() ? order.brokerage : t('rebalance.noBrokerage');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return groups;
  }, [orders, t]);

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
    if (!isOpen || unlockedTargetTickers.length === 0) {
      return;
    }

    const decimalSeparator = getDecimalSeparator(numberLocale);
    const equalWeight = (100 / unlockedTargetTickers.length).toFixed(2);
    const seededTargets: Record<string, string> = {};
    unlockedTargetTickers.forEach((ticker) => {
      seededTargets[ticker] = equalWeight.replace('.', decimalSeparator);
    });
    setTargets(seededTargets);
  }, [isOpen, numberLocale, unlockedTargetTickers]);

  const onCalculate = async () => {
    setRequestError(null);
    setOrders(null);

    const parsedDeposit = parseLocaleNumber(deposit, numberLocale);
    if (parsedDeposit < 0) {
      setRequestError(t('rebalance.errorDeposit'));
      return;
    }

    const percentDelta = Math.abs(totalTarget - 100);
    if (percentDelta > 0.01) {
      setRequestError(t('rebalance.errorTargetSum'));
      return;
    }

    const targetPortfolio = unlockedTargetTickers.map((ticker) => {
      const percent = parseLocaleNumber(targets[ticker] ?? '0', numberLocale);
      return {
        ticker,
        percentage: roundToFour(percent / 100),
        price: tickerPriceMap.get(ticker) ?? 1,
        brokerage: tickerBrokerageMap.get(ticker) ?? null,
      };
    });

    if (targetPortfolio.length === 0) {
      setRequestError(t('rebalance.errorNoAssets'));
      return;
    }

    setIsCalculating(true);
    try {
      const response = await calculateRebalance({
        newDeposit: parsedDeposit,
        currentHoldings: holdings
          .filter((holding) => !holding.isLocked)
          .map((holding) => ({
            ticker: holding.ticker,
            quantity: holding.quantity,
            price: holding.averagePrice,
            brokerage: holding.brokerage,
          })),
        targetPortfolio,
      });
      setOrders(response.orders ?? []);
    } catch {
      setRequestError(t('rebalance.errorCalc'));
    } finally {
      setIsCalculating(false);
    }
  };

  const goToStepTwo = () => {
    setRequestError(null);

    if (!deposit.trim()) {
      setRequestError(t('rebalance.errorDepositRequired'));
      return;
    }

    const parsedDeposit = parseLocaleNumber(deposit, numberLocale);
    if (parsedDeposit < 0) {
      setRequestError(t('rebalance.errorDeposit'));
      return;
    }

    setCurrentStep(2);
  };

  const goToStepThree = () => {
    setRequestError(null);

    if (unlockedTargetTickers.length === 0) {
      setRequestError(t('rebalance.errorNoAssets'));
      return;
    }

    const hasEmptyTarget = unlockedTargetTickers.some((ticker) => !(targets[ticker] ?? '').trim());
    if (hasEmptyTarget) {
      setRequestError(t('rebalance.errorTargetRequired'));
      return;
    }

    const percentDelta = Math.abs(totalTarget - 100);
    if (percentDelta > 0.01) {
      setRequestError(t('rebalance.errorTargetSum'));
      return;
    }

    setCurrentStep(3);
  };

  const getDrawerTransform = (value: Animated.Value) => {
    return [{ translateY: value }];
  };

  if (!isRendered) {
    return null;
  }

  return (
    <View style={styles.flowRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.backdropLayer,
          { opacity: backdropOpacity },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.drawerLayer} pointerEvents="box-none">
        <Animated.View
          testID="rebalance-step-1-drawer"
          style={[
            styles.drawerBase,
            styles.bottomSheetDrawerBase,
            styles.cascadeShadowTop,
            {
              width: drawerOneWidth,
              height: drawerOneHeight,
              top: drawerOneTopInset,
              left: drawerOneLeftInset,
              zIndex: 30,
              transform: getDrawerTransform(step1Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>{t('rebalance.step1Title')}</DSText>
            <DSInput
              label={t('rebalance.depositInput')}
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="decimal-pad"
              maxLength={16}
              isValueField
              valueLocale={numberLocale}
              valueMaxFractionDigits={2}
              placeholder={t('rebalance.depositPlaceholder')}
              testID="rebalance-deposit-input"
            />
            {requestError && currentStep === 1 ? <DSText style={styles.error}>{requestError}</DSText> : null}
            <View style={[styles.drawerActionsRow, isMobileLayout ? styles.drawerActionsColumn : null]}>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.close')} onPress={onClose} />
              </View>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.continue')} onPress={goToStepTwo} testID="rebalance-step-1-continue" />
              </View>
            </View>
          </ScrollView>
          {currentStep >= 2 ? <View testID="rebalance-step-1-shadow" pointerEvents="none" style={styles.previousStepShade} /> : null}
        </Animated.View>

        <Animated.View
          testID="rebalance-step-2-drawer"
          style={[
            styles.drawerBase,
            styles.bottomSheetDrawerBase,
            styles.cascadeShadowTop,
            {
              width: drawerTwoWidth,
              height: drawerTwoHeight,
              top: drawerTwoTopInset,
              left: drawerTwoLeftInset,
              zIndex: 31,
              transform: getDrawerTransform(step2Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>{t('rebalance.step2Title')}</DSText>
            {loadingHoldings ? <DSText style={styles.emptyHint}>{t('rebalance.loadingAssets')}</DSText> : null}
            {!loadingHoldings && targetTickers.length === 0 ? (
              <DSText style={styles.emptyHint}>{t('rebalance.emptyAssets')}</DSText>
            ) : null}
            {targetTickers.map((ticker) => {
              if (lockedTickers.has(ticker)) {
                return (
                  <View key={ticker} style={styles.lockedTickerRow} testID={`rebalance-locked-${ticker}`}>
                    <View style={styles.lockedTickerLabelRow}>
                      <DSText style={styles.lockedTickerLabel}>{t('rebalance.targetTickerLabel', { ticker })}</DSText>
                      <Ionicons name="lock-closed" size={14} color="#4A6286" />
                    </View>
                    <DSText style={styles.lockedTickerHint}>{t('rebalance.lockedAssetHint')}</DSText>
                  </View>
                );
              }

              return (
                <DSInput
                  key={ticker}
                  label={t('rebalance.targetTickerLabel', { ticker })}
                  value={targets[ticker] ?? ''}
                  onChangeText={(value) =>
                    setTargets((previous) => ({
                      ...previous,
                      [ticker]: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                  maxLength={8}
                  isValueField
                  valueLocale={numberLocale}
                  valueMaxFractionDigits={2}
                  testID={`rebalance-target-${ticker}`}
                />
              );
            })}
            <View style={styles.totalRow}>
              <DSText style={styles.totalLabel}>{t('rebalance.totalPercent')}</DSText>
              <DSText
                style={[
                  styles.totalValue,
                  Math.abs(totalTarget - 100) > 0.01 ? styles.totalInvalid : null,
                ]}
              >
                {formatNumber(totalTarget, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </DSText>
            </View>
            <View style={[styles.drawerActionsRow, isMobileLayout ? styles.drawerActionsColumn : null]}>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.back')} onPress={() => setCurrentStep(1)} />
              </View>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.continue')} onPress={goToStepThree} testID="rebalance-step-2-continue" />
              </View>
            </View>
            {requestError && currentStep === 2 ? <DSText style={styles.error}>{requestError}</DSText> : null}
          </ScrollView>
          {currentStep >= 3 ? <View testID="rebalance-step-2-shadow" pointerEvents="none" style={styles.previousStepShade} /> : null}
        </Animated.View>

        <Animated.View
          testID="rebalance-step-3-drawer"
          style={[
            styles.drawerBase,
            styles.bottomSheetDrawerBase,
            styles.cascadeShadowTop,
            {
              width: drawerThreeWidth,
              height: drawerThreeHeight,
              top: drawerThreeTopInset,
              left: drawerThreeLeftInset,
              zIndex: 32,
              transform: getDrawerTransform(step3Translate),
            },
          ]}
        >
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
            <DSText style={styles.stepTitle}>{t('rebalance.step3Title')}</DSText>
            <DSButton
              title={isCalculating ? t('rebalance.calculating') : t('rebalance.calculate')}
              onPress={() => void onCalculate()}
              disabled={isCalculating}
              testID="rebalance-calculate-button"
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
                          <DSText style={styles.orderMeta}>{t('rebalance.quantity', { value: order.quantity })}</DSText>
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
                            {formatCurrency(order.estimatedValue)}
                          </DSText>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
            <View style={[styles.drawerActionsRow, isMobileLayout ? styles.drawerActionsColumn : null]}>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.back')} onPress={() => setCurrentStep(2)} />
              </View>
              <View style={styles.drawerActionSlot}>
                <DSButton title={t('common.close')} onPress={onClose} />
              </View>
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
    zIndex: 30,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 20,
  },
  drawerBase: {
    position: 'absolute',
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bottomSheetDrawerBase: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  drawerActionsColumn: {
    flexDirection: 'column',
  },
  drawerActionSlot: {
    flex: 1,
  },
  emptyHint: {
    color: theme.colors.textMuted,
  },
  lockedTickerRow: {
    borderWidth: 1,
    borderColor: '#D2DEEE',
    borderRadius: 10,
    backgroundColor: '#EFF4FB',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    gap: 4,
    opacity: 0.85,
  },
  lockedTickerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lockedTickerLabel: {
    color: '#2A466B',
    fontWeight: '700',
  },
  lockedTickerHint: {
    color: '#6A7F9B',
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  previousStepShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 14, 34, 0.22)',
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
