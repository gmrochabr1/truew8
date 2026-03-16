import React, { useCallback, useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSText } from '@/src/components/common/DSText';
import { createPortfolio, getPortfolios, PortfolioSummary } from '@/src/services/portfolio';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function DashboardScreen() {
  const { email, isAuthenticated, isLoading, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loadingPortfolios} onRefresh={() => void loadPortfolios()} />}
    >
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
      </View>

      <View style={styles.footerActions}>
        <DSButton
          title="Sair"
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          testID="dashboard-logout"
        />
      </View>
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
    gap: theme.spacing.lg,
    paddingBottom: 28,
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
  footerActions: {
    marginTop: 4,
  },
});
