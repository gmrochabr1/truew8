import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { createPortfolio, getPortfolios, PortfolioSummary } from '@/src/services/portfolio';
import { useAuth } from '@/src/store/AuthContext';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

export default function DashboardScreen() {
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { email, isAuthenticated, isLoading, logout } = useAuth();
  const { t, locale, setLocale, availableLocales, formatCurrency } = useLocale();
  const isCompactPortrait = screenWidth < 640 && screenHeight >= screenWidth;
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [isCreatePortfolioDrawerRendered, setIsCreatePortfolioDrawerRendered] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [createPortfolioError, setCreatePortfolioError] = useState<string | null>(null);

  const animationStart = useMemo(
    () => (isCompactPortrait ? Math.max(screenHeight, 640) : Math.max(screenWidth, 1024)),
    [isCompactPortrait, screenHeight, screenWidth],
  );
  const createDrawerTranslate = useRef(new Animated.Value(animationStart)).current;
  const createBackdropOpacity = useRef(new Animated.Value(0)).current;

  const createDrawerWidth = useMemo(() => {
    if (isCompactPortrait) {
      return screenWidth;
    }
    const boundedWidth = Math.min(screenWidth, 1024);
    if (boundedWidth < 560) {
      return boundedWidth;
    }
    if (boundedWidth < 900) {
      return boundedWidth * 0.9;
    }
    return 520;
  }, [isCompactPortrait, screenWidth]);

  const createDrawerHeight = useMemo(() => {
    if (!isCompactPortrait) {
      return undefined;
    }
    const visibleTopGap = 72;
    const preferredHeight = Math.round(screenHeight * 0.58);
    return Math.min(preferredHeight, Math.max(screenHeight - visibleTopGap, 320));
  }, [isCompactPortrait, screenHeight]);

  const getCreateDrawerTransform = useCallback(
    (value: Animated.Value) => (isCompactPortrait ? [{ translateY: value }] : [{ translateX: value }]),
    [isCompactPortrait],
  );

  const onCreatePortfolioCardPress = () => {
    setCreatePortfolioError(null);
    setIsCreatePortfolioModalOpen(true);
  };

  const upsertPortfolioInList = useCallback((portfolio: PortfolioSummary) => {
    setPortfolios((previous) => {
      const withoutCurrent = previous.filter((item) => item.id !== portfolio.id);
      return [portfolio, ...withoutCurrent];
    });
  }, []);

  const onLogoutPress = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout]);

  const onConfirmCreatePortfolio = async () => {
    const name = newPortfolioName.trim();
    setCreatePortfolioError(null);

    try {
      setCreatingPortfolio(true);
      const created = await createPortfolio({ name: name || undefined });
      upsertPortfolioInList(created);
      setIsCreatePortfolioModalOpen(false);
      setNewPortfolioName('');
      router.push({
        pathname: '/portfolio/[id]',
        params: { id: created.id, name: created.name },
      } as never);
    } catch {
      setCreatePortfolioError(t('dashboard.createPortfolio.error'));
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const onCancelCreatePortfolio = () => {
    setIsCreatePortfolioModalOpen(false);
    setCreatePortfolioError(null);
    setNewPortfolioName('');
  };

  React.useEffect(() => {
    if (isCreatePortfolioModalOpen) {
      setIsCreatePortfolioDrawerRendered(true);
      createDrawerTranslate.setValue(animationStart);
      createBackdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(createDrawerTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(createBackdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isCreatePortfolioDrawerRendered) {
      return;
    }

    Animated.parallel([
      Animated.timing(createDrawerTranslate, {
        toValue: animationStart,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(createBackdropOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCreatePortfolioDrawerRendered(false);
    });
  }, [
    animationStart,
    createBackdropOpacity,
    createDrawerTranslate,
    isCreatePortfolioDrawerRendered,
    isCreatePortfolioModalOpen,
  ]);

  const loadPortfolios = useCallback(async () => {
    try {
      setLoadingPortfolios(true);
      setError(null);
      const response = await getPortfolios();
      setPortfolios(response);
    } catch {
      setError(t('dashboard.errorLoad'));
    } finally {
      setLoadingPortfolios(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPortfolios();
    }, [loadPortfolios]),
  );

  React.useEffect(() => {
    if (!refresh) {
      return;
    }
    void loadPortfolios();
  }, [loadPortfolios, refresh]);

  const totalInvested = useMemo(() => {
    return portfolios.reduce((sum, portfolio) => sum + portfolio.totalInvested, 0);
  }, [portfolios]);

  if (isLoading) {
    return <AuthLoadingScreen message={t('app.validatingSession')} />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loadingPortfolios} onRefresh={() => void loadPortfolios()} />}
      >
        <View style={styles.contentWrap}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIdentityRow}>
                <View style={styles.heroLogoBadge}>
                  <Image
                    source={require('../../../assets/images/TrueW8-Logo-No-Background.png')}
                    style={styles.heroLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.heroTitleWrap}>
                  <DSText style={styles.kicker}>{t('dashboard.kicker')}</DSText>
                  <DSText style={styles.title}>{t('dashboard.title')}</DSText>
                  <DSText style={styles.subtitle}>{email ?? t('dashboard.userFallback')}</DSText>
                </View>
              </View>
              <Pressable onPress={() => void onLogoutPress()} style={styles.heroLogoutButton} testID="dashboard-header-logout">
                <Ionicons name="log-out-outline" size={20} color="#EAF2FF" />
                <DSText style={styles.heroLogoutText}>{t('dashboard.logout')}</DSText>
              </Pressable>
            </View>

            <View style={styles.localeWrap}>
              <DSText style={styles.localeLabel}>{t('locale.label')}</DSText>
              <View style={styles.localeOptions}>
                {availableLocales.includes('pt-BR') ? (
                  <Pressable
                    style={[styles.localeChip, locale === 'pt-BR' ? styles.localeChipActive : null]}
                    onPress={() => void setLocale('pt-BR')}
                    testID="dashboard-locale-ptBR"
                  >
                    <DSText style={[styles.localeChipText, locale === 'pt-BR' ? styles.localeChipTextActive : null]}>
                      PT-BR
                    </DSText>
                  </Pressable>
                ) : null}
                {availableLocales.includes('en-US') ? (
                  <Pressable
                    style={[styles.localeChip, locale === 'en-US' ? styles.localeChipActive : null]}
                    onPress={() => void setLocale('en-US')}
                    testID="dashboard-locale-enUS"
                  >
                    <DSText style={[styles.localeChipText, locale === 'en-US' ? styles.localeChipTextActive : null]}>
                      EN-US
                    </DSText>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.totalChip}>
              <DSText style={styles.totalLabel}>{t('dashboard.totalInvested')}</DSText>
              <DSText style={styles.totalValue}>{formatCurrency(totalInvested)}</DSText>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <DSText style={styles.panelTitle}>{t('dashboard.portfolios')}</DSText>
              <Pressable onPress={() => void loadPortfolios()}>
                <DSText style={styles.reload}>{t('common.refresh')}</DSText>
              </Pressable>
            </View>

          {error ? <DSText style={styles.error}>{error}</DSText> : null}

            {!loadingPortfolios && portfolios.length === 0 ? (
              <View style={styles.emptyWrap}>
                <DSText style={styles.emptyText}>{t('dashboard.empty')}</DSText>
                <DSButton
                  title={t('dashboard.createFirst')}
                  onPress={onCreatePortfolioCardPress}
                  disabled={creatingPortfolio}
                  testID="dashboard-create-first-portfolio"
                />
              </View>
            ) : null}

            {portfolios.map((portfolio) => (
              <Pressable
                key={portfolio.id}
                style={styles.portfolioCard}
                onPress={() =>
                  router.push({
                    pathname: '/portfolio/[id]',
                    params: { id: portfolio.id, name: portfolio.name },
                  } as never)
                }
                testID={`portfolio-card-${portfolio.id}`}
              >
                <DSText style={styles.portfolioTitle}>{portfolio.name}</DSText>
                <DSText style={styles.portfolioDesc}>{portfolio.description ?? t('dashboard.defaultDescription')}</DSText>
                <View style={styles.portfolioMetaRow}>
                  <DSText style={styles.metaText}>{t('dashboard.assetsCount', { count: portfolio.holdingsCount })}</DSText>
                  <DSText style={styles.metaValue}>{formatCurrency(portfolio.totalInvested)}</DSText>
                </View>
              </Pressable>
            ))}

            {!loadingPortfolios ? (
              <Pressable
                style={styles.createPortfolioCard}
                onPress={onCreatePortfolioCardPress}
                testID="dashboard-create-portfolio-card"
              >
                <DSText style={styles.createPortfolioCardText}>{t('dashboard.createNew')}</DSText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {isCreatePortfolioDrawerRendered ? (
        <View style={styles.createDrawerRoot} pointerEvents="box-none">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity: createBackdropOpacity, zIndex: 20 },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onCancelCreatePortfolio} />
          </Animated.View>

          <Animated.View
            testID="dashboard-create-portfolio-drawer"
            style={[
              styles.createDrawerShell,
              isCompactPortrait ? styles.createDrawerShellMobile : styles.createDrawerShellDesktop,
              isCompactPortrait ? styles.createDrawerShadowTop : styles.createDrawerShadowLeft,
              {
                width: createDrawerWidth,
                height: createDrawerHeight ?? '100%',
                transform: getCreateDrawerTransform(createDrawerTranslate),
              },
            ]}
          >
            <ScrollView style={styles.createDrawerScroll} contentContainerStyle={styles.createDrawerContent}>
              <DSText style={styles.createDrawerTitle}>{t('dashboard.createPortfolio.title')}</DSText>
              <DSInput
                label={t('dashboard.createPortfolio.name')}
                value={newPortfolioName}
                onChangeText={setNewPortfolioName}
                placeholder={t('dashboard.createPortfolio.placeholder')}
                testID="dashboard-create-portfolio-name"
              />

              {createPortfolioError ? <DSText style={styles.error}>{createPortfolioError}</DSText> : null}

              <View style={styles.createDrawerActions}>
                <DSButton title={t('common.cancel')} onPress={onCancelCreatePortfolio} />
                <DSButton
                  title={creatingPortfolio ? t('dashboard.createPortfolio.creating') : t('dashboard.createPortfolio.confirm')}
                  onPress={() => void onConfirmCreatePortfolio()}
                  testID="dashboard-create-portfolio-confirm"
                  disabled={creatingPortfolio}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  hero: {
    borderRadius: 20,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: '#0A1A35',
    gap: theme.spacing.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  heroLogoBadge: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3D5E93',
    backgroundColor: '#F7FBFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroLogo: {
    width: 148,
    height: 44,
  },
  heroTitleWrap: {
    flex: 1,
    gap: 2,
  },
  heroLogoutButton: {
    borderWidth: 1,
    borderColor: '#35588D',
    backgroundColor: '#1B3F74',
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLogoutText: {
    color: '#EAF2FF',
    fontWeight: '700',
    fontSize: 12,
  },
  kicker: {
    color: theme.colors.gold,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 12,
  },
  title: {
    color: theme.colors.primaryText,
    fontWeight: '800',
    fontSize: 28,
  },
  subtitle: {
    color: '#CFDBEE',
    fontWeight: '600',
  },
  localeWrap: {
    marginTop: 2,
    gap: 6,
  },
  localeLabel: {
    color: '#BFD1EA',
    fontSize: 12,
    fontWeight: '700',
  },
  localeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  localeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3C5E91',
    backgroundColor: '#163661',
    paddingHorizontal: 10,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localeChipActive: {
    backgroundColor: '#F7FAFF',
    borderColor: '#D2E0F5',
  },
  localeChipText: {
    color: '#DDE9FA',
    fontSize: 12,
    fontWeight: '700',
  },
  localeChipTextActive: {
    color: '#123564',
  },
  totalChip: {
    marginTop: theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: '#173A73',
    borderWidth: 1,
    borderColor: '#284B84',
    padding: theme.spacing.sm,
    gap: 4,
  },
  totalLabel: {
    color: '#C8D8F0',
    fontSize: 12,
  },
  totalValue: {
    color: '#F6FAFF',
    fontWeight: '800',
    fontSize: 18,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontWeight: '800',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  reload: {
    color: theme.colors.emerald,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  emptyWrap: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  portfolioCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FBFF',
    borderRadius: 14,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  createPortfolioCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#8FA4C2',
    borderRadius: 14,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#F5F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPortfolioCardText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  portfolioTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  portfolioDesc: {
    color: theme.colors.textMuted,
  },
  portfolioMetaRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    color: theme.colors.emerald,
    fontWeight: '800',
  },
  createDrawerRoot: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        position: 'fixed',
      },
      default: {},
    }),
  },
  createDrawerShell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    zIndex: 30,
  },
  createDrawerShellDesktop: {
    right: 0,
    top: 0,
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  createDrawerShellMobile: {
    right: 0,
    left: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  createDrawerShadowLeft: {
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.18,
    elevation: 10,
  },
  createDrawerShadowTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    elevation: 10,
  },
  createDrawerScroll: {
    flex: 1,
  },
  createDrawerContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  createDrawerTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  createDrawerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
});
