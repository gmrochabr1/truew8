import React, { useCallback, useMemo, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { ConfirmActionModal } from '@/src/components/common/ConfirmActionModal';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { CascadingRebalanceFlow } from '@/src/components/rebalance/CascadingRebalanceFlow';
import { maskNumericInput, parseLocaleNumber } from '@/src/services/numericInput';
import { addHoldingManual, deletePortfolio, getPortfolioHoldings, getPortfolios, updatePortfolio, UserHolding } from '@/src/services/portfolio';
import { useAuth } from '@/src/store/AuthContext';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

export default function PortfolioDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const portfolioId = String(id ?? '');
  const { isAuthenticated, isLoading } = useAuth();
  const { t, locale, formatCurrency } = useLocale();
  const isCompactPortrait = screenWidth < 640 && screenHeight >= screenWidth;
  const numberLocale = locale === 'en-US' ? 'en-US' : 'pt-BR';
  const averagePricePlaceholder = numberLocale === 'en-US' ? '0.00' : '0,00';

  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [portfolioName, setPortfolioName] = useState(String(name ?? '').trim());
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManualDrawerOpen, setIsManualDrawerOpen] = useState(false);
  const [isManualDrawerRendered, setIsManualDrawerRendered] = useState(false);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditNameDrawerOpen, setIsEditNameDrawerOpen] = useState(false);
  const [isEditNameDrawerRendered, setIsEditNameDrawerRendered] = useState(false);
  const [editedPortfolioName, setEditedPortfolioName] = useState('');
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [isSavingPortfolioName, setIsSavingPortfolioName] = useState(false);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [isClosingPortfolio, setIsClosingPortfolio] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);
  const [isSavingManualHolding, setIsSavingManualHolding] = useState(false);

  const drawerWidth = useMemo(() => {
    if (isCompactPortrait) {
      return screenWidth;
    }
    const boundedWidth = Math.min(screenWidth, 1024);
    if (boundedWidth < 560) {
      return boundedWidth;
    }
    return Math.min(boundedWidth * 0.94, 1024);
  }, [isCompactPortrait, screenWidth]);

  const manualDrawerWidth = useMemo(() => {
    if (isCompactPortrait) {
      return screenWidth;
    }
    if (drawerWidth < 560) {
      return drawerWidth;
    }
    if (drawerWidth < 900) {
      return drawerWidth * 0.9;
    }
    return 520;
  }, [drawerWidth, isCompactPortrait, screenWidth]);

  const portfolioDrawerHeight = useMemo(() => {
    const visibleTopGap = isCompactPortrait ? 72 : 96;
    const preferredHeight = Math.round(screenHeight * (isCompactPortrait ? 0.82 : 0.86));
    return Math.min(preferredHeight, Math.max(screenHeight - visibleTopGap, 420));
  }, [isCompactPortrait, screenHeight]);

  const manualDrawerHeight = useMemo(() => {
    const visibleTopGap = isCompactPortrait ? 88 : 112;
    const preferredHeight = Math.round(screenHeight * (isCompactPortrait ? 0.68 : 0.72));
    return Math.min(preferredHeight, Math.max(screenHeight - visibleTopGap, 320));
  }, [isCompactPortrait, screenHeight]);

  const portfolioDrawerTopInset = useMemo(() => {
    return Math.max(screenHeight - portfolioDrawerHeight, 56);
  }, [portfolioDrawerHeight, screenHeight]);

  const manualDrawerTopInset = useMemo(() => {
    return Math.max(screenHeight - manualDrawerHeight, 56);
  }, [manualDrawerHeight, screenHeight]);

  const drawerLeftInset = useMemo(() => Math.max((screenWidth - drawerWidth) / 2, 0), [drawerWidth, screenWidth]);
  const manualDrawerLeftInset = useMemo(
    () => Math.max((screenWidth - manualDrawerWidth) / 2, 0),
    [manualDrawerWidth, screenWidth],
  );

  const animationStart = useMemo(() => Math.max(screenHeight, 640), [screenHeight]);

  const drawerTranslate = useMemo(() => new Animated.Value(animationStart), [animationStart]);
  const backdropOpacity = useMemo(() => new Animated.Value(0), []);
  const manualDrawerTranslate = useMemo(() => new Animated.Value(animationStart), [animationStart]);
  const manualBackdropOpacity = useMemo(() => new Animated.Value(0), []);
  const editNameDrawerTranslate = useMemo(() => new Animated.Value(animationStart), [animationStart]);
  const editNameBackdropOpacity = useMemo(() => new Animated.Value(0), []);

  const getDrawerTransform = useCallback((value: Animated.Value) => [{ translateY: value }], []);

  React.useEffect(() => {
    const normalizedName = String(name ?? '').trim();
    if (normalizedName) {
      setPortfolioName(normalizedName);
    }
  }, [name]);

  React.useEffect(() => {
    drawerTranslate.setValue(animationStart);
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
  }, [animationStart, backdropOpacity, drawerTranslate]);

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

  React.useEffect(() => {
    if (isEditNameDrawerOpen) {
      setIsEditNameDrawerRendered(true);
      editNameDrawerTranslate.setValue(animationStart);
      editNameBackdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(editNameDrawerTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(editNameBackdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isEditNameDrawerRendered) {
      return;
    }

    Animated.parallel([
      Animated.timing(editNameDrawerTranslate, {
        toValue: animationStart,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(editNameBackdropOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsEditNameDrawerRendered(false);
    });
  }, [
    animationStart,
    editNameBackdropOpacity,
    editNameDrawerTranslate,
    isEditNameDrawerOpen,
    isEditNameDrawerRendered,
  ]);

  const loadHoldings = useCallback(async () => {
    try {
      setLoadingHoldings(true);
      setError(null);
      const data = await getPortfolioHoldings(portfolioId);
      setHoldings(data);

      try {
        const summaries = await getPortfolios();
        const matchingSummary = summaries.find((portfolio) => portfolio.id === portfolioId);
        if (matchingSummary?.name) {
          setPortfolioName(matchingSummary.name);
        }
      } catch {
        // Keep the last known route name if summaries fail.
      }
    } catch {
      setError(t('portfolio.loadError'));
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
    return <AuthLoadingScreen message={t('app.validatingSession')} />;
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
        toValue: animationStart,
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

  const openEditNameDrawer = () => {
    setEditNameError(null);
    setEditedPortfolioName(portfolioName);
    setIsEditNameDrawerOpen(true);
  };

  const closeEditNameDrawer = () => {
    if (isSavingPortfolioName) {
      return;
    }
    setIsEditNameDrawerOpen(false);
  };

  const openManualDrawer = () => {
    setFormError(null);
    setIsManualDrawerOpen(true);
  };

  const openDeletePortfolioModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeletePortfolioModal = () => {
    if (isDeletingPortfolio) {
      return;
    }
    setIsDeleteModalOpen(false);
  };

  const onConfirmDeletePortfolio = async () => {
    try {
      setIsDeletingPortfolio(true);
      await deletePortfolio(portfolioId);
      setIsDeleteModalOpen(false);
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/dashboard' as never);
    } catch {
      setError(t('portfolio.deleteError'));
    } finally {
      setIsDeletingPortfolio(false);
    }
  };

  const onSaveManualHolding = async () => {
    setFormError(null);
    const parsedQuantity = parseLocaleNumber(quantity, numberLocale);
    const parsedAveragePrice = parseLocaleNumber(averagePrice, numberLocale);

    if (!ticker.trim() || !brokerage.trim() || parsedQuantity <= 0 || parsedAveragePrice <= 0) {
      setFormError(t('portfolio.formError'));
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
      setFormError(t('portfolio.addError'));
    } finally {
      setIsSavingManualHolding(false);
    }
  };

  const onAveragePriceChange = useCallback((value: string) => {
    setAveragePrice(maskNumericInput(value, { locale: numberLocale, maxFractionDigits: 2 }));
  }, [numberLocale]);

  const onSavePortfolioName = async () => {
    const normalizedName = editedPortfolioName.trim();

    if (!normalizedName) {
      setEditNameError(t('portfolio.nameInvalid'));
      return;
    }

    try {
      setIsSavingPortfolioName(true);
      setEditNameError(null);
      const updated = await updatePortfolio(portfolioId, { name: normalizedName });
      setPortfolioName(updated.name);
      setIsEditNameDrawerOpen(false);
    } catch {
      setEditNameError(t('portfolio.nameUpdateError'));
    } finally {
      setIsSavingPortfolioName(false);
    }
  };

  return (
    <View style={[styles.overlayRoot, isCompactPortrait ? styles.overlayRootMobile : null]}>
      <Animated.View style={[styles.pageBackdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closePortfolioDrawer} />
      </Animated.View>

      <Animated.View
        testID="portfolio-detail-drawer"
        style={[
          styles.drawerShell,
          styles.drawerShellBottomSheet,
          styles.drawerShadowTop,
          {
            width: drawerWidth,
            height: portfolioDrawerHeight,
            top: portfolioDrawerTopInset,
            left: drawerLeftInset,
            transform: getDrawerTransform(drawerTranslate),
          },
        ]}
      >
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.contentWrap}>
              <View style={styles.headerRow}>
                <View style={styles.headerCard}>
                  <DSText style={styles.headerTitle}>{portfolioName || t('portfolio.titleFallback')}</DSText>
                  <DSText style={styles.headerSubtitle}>{t('portfolio.subtitle', { count: holdings.length, total: formatCurrency(totalInvested) })}</DSText>
                </View>
                <View style={styles.headerActionsColumn}>
                  <Pressable onPress={openEditNameDrawer} style={styles.secondaryDrawerButton} testID="portfolio-edit-name-button">
                    <DSText style={styles.secondaryDrawerButtonText}>{t('portfolio.editName')}</DSText>
                  </Pressable>
                  <Pressable onPress={openDeletePortfolioModal} style={styles.deleteDrawerButton} testID="portfolio-delete-button">
                    <DSText style={styles.deleteDrawerButtonText}>{t('portfolio.delete')}</DSText>
                  </Pressable>
                  <Pressable onPress={closePortfolioDrawer} style={styles.closeDrawerButton} testID="portfolio-close-drawer">
                    <DSText style={styles.closeDrawerText}>{t('portfolio.close')}</DSText>
                  </Pressable>
                </View>
              </View>

              {error ? <DSText style={styles.error}>{error}</DSText> : null}
              {loadingHoldings ? <DSText>{t('portfolio.loadingHoldings')}</DSText> : null}

              <View style={styles.rebalanceCta}>
                <DSButton
                  title={t('portfolio.rebalanceCta')}
                  onPress={() => setIsRebalanceOpen(true)}
                  testID="portfolio-rebalance-button"
                  disabled={loadingHoldings || holdings.length === 0}
                />
              </View>

              {holdings.map((holding) => (
                <View key={holding.id} style={styles.holdingCard}>
                  <View style={styles.holdingHeader}>
                    <DSText style={styles.holdingTicker}>{holding.ticker}</DSText>
                    <DSText style={styles.holdingBrokerage}>{holding.brokerage}</DSText>
                  </View>
                  <DSText style={styles.holdingMeta}>{t('portfolio.quantity', { value: holding.quantity })}</DSText>
                  <DSText style={styles.holdingMeta}>{t('portfolio.averagePrice', { value: formatCurrency(holding.averagePrice) })}</DSText>
                  <DSText style={styles.holdingMeta}>{t('portfolio.brokerage', { value: holding.brokerage })}</DSText>
                </View>
              ))}

              {!loadingHoldings && holdings.length === 0 ? (
                <View style={styles.emptyState}>
                  <DSText style={styles.emptyText}>{t('portfolio.empty')}</DSText>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <Pressable
            style={styles.fab}
            onPress={openManualDrawer}
            testID="portfolio-add-manual-fab"
          >
            <DSText style={styles.fabLabel}>{t('portfolio.addManual')}</DSText>
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
                testID="portfolio-manual-drawer"
                style={[
                  styles.manualDrawerShell,
                  styles.manualDrawerShellBottomSheet,
                  styles.manualDrawerShadowTop,
                  {
                    width: manualDrawerWidth,
                    height: manualDrawerHeight,
                    top: manualDrawerTopInset,
                    left: manualDrawerLeftInset,
                    transform: getDrawerTransform(manualDrawerTranslate),
                  },
                ]}
              >
                <ScrollView style={styles.manualDrawerScroll} contentContainerStyle={styles.manualDrawerContent}>
                  <DSText style={styles.manualDrawerTitle}>{t('portfolio.newAsset')}</DSText>
                  <DSInput
                    label={t('portfolio.ticker')}
                    value={ticker}
                    onChangeText={setTicker}
                    autoCapitalize="characters"
                    maxLength={12}
                    testID="manual-ticker"
                  />
                  <DSInput
                    label={t('portfolio.quantityInput')}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    maxLength={20}
                    isValueField
                    valueLocale={numberLocale}
                    valueMaxFractionDigits={8}
                    testID="manual-quantity"
                  />
                  <DSInput
                    label={t('portfolio.averagePriceInput')}
                    value={averagePrice}
                    onChangeText={onAveragePriceChange}
                    keyboardType="decimal-pad"
                    maxLength={16}
                    placeholder={averagePricePlaceholder}
                    testID="manual-average-price"
                  />
                  <DSInput
                    label={t('portfolio.brokerageInput')}
                    value={brokerage}
                    onChangeText={setBrokerage}
                    maxLength={64}
                    testID="manual-brokerage"
                  />

                  {formError ? <DSText style={styles.error}>{formError}</DSText> : null}

                  <View style={styles.manualDrawerActions}>
                    <DSButton title={t('common.cancel')} onPress={closeManualDrawer} disabled={isSavingManualHolding} />
                    <DSButton
                      title={isSavingManualHolding ? t('common.saving') : t('common.save')}
                      onPress={() => void onSaveManualHolding()}
                      testID="manual-save-button"
                      disabled={isSavingManualHolding}
                    />
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          ) : null}

          {isEditNameDrawerRendered ? (
            <View style={styles.manualDrawerRoot} pointerEvents="box-none">
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity: editNameBackdropOpacity, zIndex: 20 },
                ]}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeEditNameDrawer} />
              </Animated.View>

              <Animated.View
                testID="portfolio-edit-name-drawer"
                style={[
                  styles.manualDrawerShell,
                  styles.manualDrawerShellBottomSheet,
                  styles.manualDrawerShadowTop,
                  {
                    width: manualDrawerWidth,
                    height: manualDrawerHeight,
                    top: manualDrawerTopInset,
                    left: manualDrawerLeftInset,
                    transform: getDrawerTransform(editNameDrawerTranslate),
                  },
                ]}
              >
                <ScrollView style={styles.manualDrawerScroll} contentContainerStyle={styles.manualDrawerContent}>
                  <DSText style={styles.manualDrawerTitle}>{t('portfolio.nameDrawerTitle')}</DSText>
                  <DSInput
                    label={t('portfolio.nameInput')}
                    value={editedPortfolioName}
                    onChangeText={setEditedPortfolioName}
                    placeholder={t('portfolio.namePlaceholder')}
                    maxLength={80}
                    testID="portfolio-edit-name-input"
                  />

                  {editNameError ? <DSText style={styles.error}>{editNameError}</DSText> : null}

                  <View style={styles.manualDrawerActions}>
                    <DSButton title={t('common.cancel')} onPress={closeEditNameDrawer} disabled={isSavingPortfolioName} />
                    <DSButton
                      title={isSavingPortfolioName ? t('common.saving') : t('common.save')}
                      onPress={() => void onSavePortfolioName()}
                      testID="portfolio-edit-name-save"
                      disabled={isSavingPortfolioName}
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

          <ConfirmActionModal
            visible={isDeleteModalOpen}
            title={t('portfolio.deleteModalTitle')}
            message={t('portfolio.deleteModalMessage')}
            confirmLabel={t('portfolio.deleteModalConfirm')}
            busyConfirmLabel={t('portfolio.deleteModalBusy')}
            onConfirm={() => void onConfirmDeletePortfolio()}
            onCancel={closeDeletePortfolioModal}
            isBusy={isDeletingPortfolio}
            testID="portfolio-delete-modal"
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
    alignItems: 'stretch',
  },
  overlayRootMobile: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  pageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 35, 0.52)',
  },
  drawerShell: {
    position: 'absolute',
    overflow: 'hidden',
  },
  drawerShellBottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  drawerShadowTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
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
  headerActionsColumn: {
    gap: 8,
    justifyContent: 'space-between',
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
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryDrawerButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37639A',
    backgroundColor: '#1F4D85',
    paddingHorizontal: 14,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryDrawerButtonText: {
    color: '#E8F2FF',
    fontWeight: '700',
  },
  deleteDrawerButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A1454D',
    backgroundColor: '#7A2730',
    paddingHorizontal: 14,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteDrawerButtonText: {
    color: '#FFECEE',
    fontWeight: '800',
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
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    zIndex: 30,
  },
  manualDrawerShellBottomSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  manualDrawerShadowTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
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
    flexDirection: 'column',
    gap: theme.spacing.sm,
    justifyContent: 'flex-start',
  },
});
