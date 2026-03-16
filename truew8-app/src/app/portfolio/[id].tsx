import React, { useCallback, useMemo, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
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
  const portfolioId = String(id ?? 'default');
  const { isAuthenticated, isLoading } = useAuth();

  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const onSaveManualHolding = async () => {
    setFormError(null);
    const parsedQuantity = parseDecimal(quantity);
    const parsedAveragePrice = parseDecimal(averagePrice);

    if (!ticker.trim() || !brokerage.trim() || parsedQuantity <= 0 || parsedAveragePrice <= 0) {
      setFormError('Preencha ticker, corretora, quantidade e preco medio com valores validos.');
      return;
    }

    try {
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
      setModalVisible(false);
    } catch {
      setFormError('Nao foi possivel adicionar o ativo manualmente.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <DSText style={styles.headerTitle}>Carteira {portfolioId === 'default' ? 'Principal' : portfolioId}</DSText>
          <DSText style={styles.headerSubtitle}>{holdings.length} ativos | {currencyFormatter.format(totalInvested)}</DSText>
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
            onPress={() => router.push(`/portfolio/${portfolioId}/rebalance` as never)}
            testID="portfolio-rebalance-button"
          />
        </View>
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        testID="portfolio-add-manual-fab"
      >
        <DSText style={styles.fabLabel}>+ Adicionar Ativo Manualmente</DSText>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <DSText style={styles.modalTitle}>Novo ativo</DSText>
            <DSInput label="Ticker" value={ticker} onChangeText={setTicker} autoCapitalize="characters" testID="manual-ticker" />
            <DSInput label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" testID="manual-quantity" />
            <DSInput label="Preco medio" value={averagePrice} onChangeText={setAveragePrice} keyboardType="numeric" testID="manual-average-price" />
            <DSInput label="Corretora" value={brokerage} onChangeText={setBrokerage} testID="manual-brokerage" />

            {formError ? <DSText style={styles.error}>{formError}</DSText> : null}

            <View style={styles.modalActions}>
              <DSButton title="Cancelar" onPress={() => setModalVisible(false)} />
              <DSButton title="Salvar" onPress={() => void onSaveManualHolding()} testID="manual-save-button" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: 130,
  },
  headerCard: {
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
    right: theme.spacing.lg,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 39, 74, 0.5)',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
});
