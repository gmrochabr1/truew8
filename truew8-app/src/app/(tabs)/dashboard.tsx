import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { createPortfolio, getPortfolios, PortfolioSummary } from '@/src/services/portfolio';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const { email, isAuthenticated, isLoading, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [isCreatePortfolioDrawerRendered, setIsCreatePortfolioDrawerRendered] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [createPortfolioError, setCreatePortfolioError] = useState<string | null>(null);

  const animationStart = useMemo(() => Math.max(screenWidth, 1024), [screenWidth]);
  const createDrawerTranslate = useRef(new Animated.Value(animationStart)).current;
  const createBackdropOpacity = useRef(new Animated.Value(0)).current;

  const createDrawerWidth = useMemo(() => {
    const boundedWidth = Math.min(screenWidth, 1024);
    if (boundedWidth < 560) {
      return boundedWidth;
    }
    if (boundedWidth < 900) {
      return boundedWidth * 0.9;
    }
    return 520;
  }, [screenWidth]);

  const onCreatePortfolioCardPress = () => {
    setCreatePortfolioError(null);
    setIsCreatePortfolioModalOpen(true);
  };

  const onLogoutPress = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => void onLogoutPress()} style={styles.headerLogoutButton} testID="dashboard-header-logout">
          <DSText style={styles.headerLogoutText}>Sair</DSText>
        </Pressable>
      ),
    });
  }, [navigation, onLogoutPress]);

  const onConfirmCreatePortfolio = async () => {
    const name = newPortfolioName.trim();
    setCreatePortfolioError(null);

    try {
      setCreatingPortfolio(true);
      const created = await createPortfolio({ name: name || undefined });
      setIsCreatePortfolioModalOpen(false);
      setNewPortfolioName('');
      router.push(`/portfolio/${created.id}` as never);
    } catch {
      setCreatePortfolioError('Nao foi possivel criar a carteira agora.');
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

  const onCreateFirstPortfolio = async () => {
    try {
      setCreatingPortfolio(true);
      setError(null);
      const created = await createPortfolio();
      router.push(`/portfolio/${created.id}` as never);
    } catch {
      setError('Nao foi possivel criar a carteira agora.');
    } finally {
      setCreatingPortfolio(false);
    }
  };


  const loadPortfolios = useCallback(async () => {
    try {
      setLoadingPortfolios(true);
      setError(null);
      const response = await getPortfolios();
      setPortfolios(response);
    } catch {
      setError('Nao foi possivel carregar suas carteiras agora.');
    } finally {
      setLoadingPortfolios(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPortfolios();
    }, [loadPortfolios]),
  );

  const totalInvested = useMemo(() => {
    return portfolios.reduce((sum, portfolio) => sum + portfolio.totalInvested, 0);
  }, [portfolios]);

  if (isLoading) {
    return <AuthLoadingScreen message="Validando sessao..." />;
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
            <DSText style={styles.kicker}>Investidor Autonomo</DSText>
            <DSText style={styles.title}>Visao Consolidada</DSText>
            <DSText style={styles.subtitle}>{email ?? 'Usuario'}</DSText>
            <View style={styles.totalChip}>
              <DSText style={styles.totalLabel}>Total investido</DSText>
              <DSText style={styles.totalValue}>{currencyFormatter.format(totalInvested)}</DSText>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <DSText style={styles.panelTitle}>Carteiras</DSText>
              <Pressable onPress={() => void loadPortfolios()}>
                <DSText style={styles.reload}>Atualizar</DSText>
              </Pressable>
            </View>

          {error ? <DSText style={styles.error}>{error}</DSText> : null}

            {!loadingPortfolios && portfolios.length === 0 ? (
              <View style={styles.emptyWrap}>
                <DSText style={styles.emptyText}>Nenhuma carteira encontrada.</DSText>
                <DSButton
                  title={creatingPortfolio ? 'Criando carteira...' : 'Criar minha primeira carteira'}
                  onPress={() => void onCreateFirstPortfolio()}
                  disabled={creatingPortfolio}
                  testID="dashboard-create-first-portfolio"
                />
              </View>
            ) : null}

            {portfolios.map((portfolio) => (
              <Pressable
                key={portfolio.id}
                style={styles.portfolioCard}
                onPress={() => router.push(`/portfolio/${portfolio.id}` as never)}
                testID={`portfolio-card-${portfolio.id}`}
              >
                <DSText style={styles.portfolioTitle}>{portfolio.name}</DSText>
                <DSText style={styles.portfolioDesc}>{portfolio.description ?? 'Carteira sem descricao'}</DSText>
                <View style={styles.portfolioMetaRow}>
                  <DSText style={styles.metaText}>{portfolio.holdingsCount} ativos</DSText>
                  <DSText style={styles.metaValue}>{currencyFormatter.format(portfolio.totalInvested)}</DSText>
                </View>
              </Pressable>
            ))}

            {!loadingPortfolios ? (
              <Pressable
                style={styles.createPortfolioCard}
                onPress={onCreatePortfolioCardPress}
                testID="dashboard-create-portfolio-card"
              >
                <DSText style={styles.createPortfolioCardText}>+ Criar Nova Carteira</DSText>
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
            style={[
              styles.createDrawerShell,
              {
                width: createDrawerWidth,
                transform: [{ translateX: createDrawerTranslate }],
              },
            ]}
          >
            <ScrollView style={styles.createDrawerScroll} contentContainerStyle={styles.createDrawerContent}>
              <DSText style={styles.createDrawerTitle}>Nova carteira</DSText>
              <DSInput
                label="Nome da carteira"
                value={newPortfolioName}
                onChangeText={setNewPortfolioName}
                placeholder="Ex.: Dividendos Longo Prazo"
                testID="dashboard-create-portfolio-name"
              />

              {createPortfolioError ? <DSText style={styles.error}>{createPortfolioError}</DSText> : null}

              <View style={styles.createDrawerActions}>
                <DSButton title="Cancelar" onPress={onCancelCreatePortfolio} />
                <DSButton
                  title={creatingPortfolio ? 'Criando...' : 'Criar'}
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
  headerLogoutButton: {
    borderWidth: 1,
    borderColor: '#35588D',
    backgroundColor: '#1B3F74',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: theme.spacing.md,
  },
  headerLogoutText: {
    color: '#EAF2FF',
    fontWeight: '800',
  },
  createDrawerRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  createDrawerShell: {
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
