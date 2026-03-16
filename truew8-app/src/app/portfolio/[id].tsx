import React, { useCallback, useMemo, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { CascadingRebalanceFlow } from '@/src/components/rebalance/CascadingRebalanceFlow';
import { addHoldingManual, getPortfolioHoldings, UserHolding } from '@/src/services/portfolio';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

export default function PortfolioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const portfolioId = String(id ?? '');
  const { isAuthenticated, isLoading } = useAuth();

  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManualDrawerOpen, setIsManualDrawerOpen] = useState(false);
  const [isManualDrawerRendered, setIsManualDrawerRendered] = useState(false);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [isClosingPortfolio, setIsClosingPortfolio] = useState(false);
  const [isSavingManualHolding, setIsSavingManualHolding] = useState(false);

  const drawerWidth = useMemo(() => {
    const boundedWidth = Math.min(screenWidth, 1024);
    if (boundedWidth < 560) {
      return boundedWidth;
    }
    return Math.min(boundedWidth * 0.94, 1024);
  }, [screenWidth]);

  const manualDrawerWidth = useMemo(() => {
    if (drawerWidth < 560) {
      return drawerWidth;
    }
    if (drawerWidth < 900) {
      return drawerWidth * 0.9;
    }
    return 520;
  }, [drawerWidth]);

  const animationStart = useMemo(() => Math.max(screenWidth, 1024), [screenWidth]);

  const drawerTranslate = useMemo(() => new Animated.Value(screenWidth), [screenWidth]);
  const backdropOpacity = useMemo(() => new Animated.Value(0), []);
  const manualDrawerTranslate = useMemo(() => new Animated.Value(animationStart), [animationStart]);
  const manualBackdropOpacity = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    drawerTranslate.setValue(screenWidth);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(drawerTranslate, {
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
  }, [screenWidth, drawerTranslate, backdropOpacity]);

  React.useEffect(() => {
    if (isManualDrawerOpen) {
      setIsManualDrawerRendered(true);
      manualDrawerTranslate.setValue(animationStart);
      manualBackdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(manualDrawerTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(manualBackdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isManualDrawerRendered) {
      return;
    }

    Animated.parallel([
      Animated.timing(manualDrawerTranslate, {
        toValue: animationStart,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(manualBackdropOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsManualDrawerRendered(false);
    });
  }, [
    animationStart,
    isManualDrawerOpen,
    isManualDrawerRendered,
    manualBackdropOpacity,
    manualDrawerTranslate,
  ]);

  const loadHoldings = useCallback(async () => {
    try {
      setLoadingHoldings(true);
      setError(null);
      const data = await getPortfolioHoldings(portfolioId);
      setHoldings(data);
    } catch {
      setError('Nao foi possivel carregar os ativos desta carteira.');
    } finally {
      setLoadingHoldings(false);
    }
  }, [portfolioId]);

  useFocusEffect(
    useCallback(() => {
      void loadHoldings();
    }, [loadHoldings]),
  );

  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, holding) => sum + holding.quantity * holding.averagePrice, 0);
  }, [holdings]);

  if (isLoading) {
    return <AuthLoadingScreen message="Validando sessao..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!portfolioId) {
    return <Redirect href={'/dashboard' as never} />;
  }

  const closePortfolioDrawer = () => {
    if (isClosingPortfolio) {
      return;
    }
    setIsClosingPortfolio(true);
    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: screenWidth,
        duration: 280,
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
      setIsClosingPortfolio(false);
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/dashboard' as never);
    });
  };

  const closeManualDrawer = () => {
    if (isSavingManualHolding) {
      return;
    }
    setIsManualDrawerOpen(false);
  };

  const openManualDrawer = () => {
    setFormError(null);
    setIsManualDrawerOpen(true);
  };

  const onSaveManualHolding = async () => {
    setFormError(null);
    const parsedQuantity = parseDecimal(quantity);
    const parsedAveragePrice = parseDecimal(averagePrice);

    if (!ticker.trim() || !brokerage.trim() || parsedQuantity <= 0 || parsedAveragePrice <= 0) {
      setFormError('Preencha ticker, corretora, quantidade e preco medio com valores validos.');
      return;
    }

    try {
      setIsSavingManualHolding(true);
      const created = await addHoldingManual(portfolioId, {
        ticker,
        brokerage,
        quantity: parsedQuantity,
        averagePrice: parsedAveragePrice,
      });

      setHoldings((previous) => [...previous, created]);
      setTicker('');
      setQuantity('');
      setAveragePrice('');
      setBrokerage('');
      setIsManualDrawerOpen(false);
    } catch {
      setFormError('Nao foi possivel adicionar o ativo manualmente.');
    } finally {
      setIsSavingManualHolding(false);
    }
  };

  return (
    <View style={styles.overlayRoot}>
      <Animated.View style={[styles.pageBackdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closePortfolioDrawer} />
      </Animated.View>

      <Animated.View style={[styles.drawerShell, { width: drawerWidth, transform: [{ translateX: drawerTranslate }] }]}
      >
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.contentWrap}>
              <View style={styles.headerRow}>
                <View style={styles.headerCard}>
                  <DSText style={styles.headerTitle}>Carteira {portfolioId}</DSText>
                  <DSText style={styles.headerSubtitle}>{holdings.length} ativos | {currencyFormatter.format(totalInvested)}</DSText>
                </View>
                <Pressable onPress={closePortfolioDrawer} style={styles.closeDrawerButton} testID="portfolio-close-drawer">
                  <DSText style={styles.closeDrawerText}>Fechar</DSText>
                </Pressable>
              </View>

              {error ? <DSText style={styles.error}>{error}</DSText> : null}
              {loadingHoldings ? <DSText>Carregando ativos...</DSText> : null}

              {holdings.map((holding) => (
                <View key={holding.id} style={styles.holdingCard}>
                  <View style={styles.holdingHeader}>
                    <DSText style={styles.holdingTicker}>{holding.ticker}</DSText>
                    <DSText style={styles.holdingBrokerage}>{holding.brokerage}</DSText>
                  </View>
                  <DSText style={styles.holdingMeta}>Quantidade: {holding.quantity}</DSText>
                  <DSText style={styles.holdingMeta}>Preco medio: {currencyFormatter.format(holding.averagePrice)}</DSText>
                  <DSText style={styles.holdingMeta}>Corretora: {holding.brokerage}</DSText>
                </View>
              ))}

              {!loadingHoldings && holdings.length === 0 ? (
                <View style={styles.emptyState}>
                  <DSText style={styles.emptyText}>Nenhum ativo nesta carteira ainda.</DSText>
                </View>
              ) : null}

              <View style={styles.rebalanceCta}>
                <DSButton
                  title="Novo Aporte (Rebalancear)"
                  onPress={() => setIsRebalanceOpen(true)}
                  testID="portfolio-rebalance-button"
                />
              </View>
            </View>
          </ScrollView>

          <Pressable
            style={styles.fab}
            onPress={openManualDrawer}
            testID="portfolio-add-manual-fab"
          >
            <DSText style={styles.fabLabel}>+ Adicionar Ativo Manualmente</DSText>
          </Pressable>

          {isManualDrawerRendered ? (
            <View style={styles.manualDrawerRoot} pointerEvents="box-none">
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity: manualBackdropOpacity, zIndex: 20 },
                ]}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeManualDrawer} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.manualDrawerShell,
                  {
                    width: manualDrawerWidth,
                    transform: [{ translateX: manualDrawerTranslate }],
                  },
                ]}
              >
                <ScrollView style={styles.manualDrawerScroll} contentContainerStyle={styles.manualDrawerContent}>
                  <DSText style={styles.manualDrawerTitle}>Novo ativo</DSText>
                  <DSInput label="Ticker" value={ticker} onChangeText={setTicker} autoCapitalize="characters" testID="manual-ticker" />
                  <DSInput label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" testID="manual-quantity" />
                  <DSInput label="Preco medio" value={averagePrice} onChangeText={setAveragePrice} keyboardType="numeric" testID="manual-average-price" />
                  <DSInput label="Corretora" value={brokerage} onChangeText={setBrokerage} testID="manual-brokerage" />

                  {formError ? <DSText style={styles.error}>{formError}</DSText> : null}

                  <View style={styles.manualDrawerActions}>
                    <DSButton title="Cancelar" onPress={closeManualDrawer} disabled={isSavingManualHolding} />
                    <DSButton
                      title={isSavingManualHolding ? 'Salvando...' : 'Salvar'}
                      onPress={() => void onSaveManualHolding()}
                      testID="manual-save-button"
                      disabled={isSavingManualHolding}
                    />
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          ) : null}

          <CascadingRebalanceFlow
            isOpen={isRebalanceOpen}
            onClose={() => setIsRebalanceOpen(false)}
            screenWidth={drawerWidth}
            holdings={holdings}
            loadingHoldings={loadingHoldings}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  pageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 35, 0.52)',
  },
  drawerShell: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.24,
    elevation: 18,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    width: '100%',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: 130,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'stretch',
  },
  headerCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23477D',
    backgroundColor: '#123A71',
    padding: theme.spacing.md,
  },
  headerTitle: {
    color: '#F7FAFF',
    fontWeight: '800',
    fontSize: 20,
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#CEE0F8',
    fontWeight: '600',
  },
  closeDrawerButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A4A80',
    backgroundColor: '#11325E',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeDrawerText: {
    color: '#E3EEFF',
    fontWeight: '800',
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  holdingCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: 4,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  holdingTicker: {
    fontWeight: '800',
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  holdingBrokerage: {
    color: theme.colors.gold,
    fontWeight: '800',
  },
  holdingMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    backgroundColor: '#F8FBFF',
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  rebalanceCta: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: 24,
    borderRadius: 999,
    backgroundColor: theme.colors.emerald,
    borderWidth: 1,
    borderColor: '#0F6D49',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fabLabel: {
    color: '#F1FFFA',
    fontWeight: '800',
    fontSize: 13,
  },
  manualDrawerRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  manualDrawerShell: {
    position: 'absolute',
    right: 0,
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.18,
    elevation: 10,
  },
  manualDrawerScroll: {
    flex: 1,
  },
  manualDrawerContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  manualDrawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  manualDrawerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
});
