import { useFocusEffect } from "@react-navigation/native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";

import { AuthLoadingScreen } from "@/src/components/common/AuthLoadingScreen";
import { CreatePortfolioDrawer, DashboardHero, FaqBottomSheet, PortfolioListPanel } from "@/src/components/dashboard";
import { dashboardStyles } from "@/src/components/dashboard/styles";
import { PortfolioSummary, createPortfolio, getPortfolios, setPortfolioLock } from "@/src/services/portfolio";
import { useAuth } from "@/src/store/AuthContext";
import { useLocale } from "@/src/store/LocaleContext";
import { theme } from "@/src/theme/tokens";

export default function DashboardScreen() {
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { email, isAuthenticated, isLoading, logout } = useAuth();
  const { t, formatCurrency } = useLocale();

  const isCompactPortrait = screenWidth < 640 && screenHeight >= screenWidth;

  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockingPortfolioId, setLockingPortfolioId] = useState<string | null>(null);

  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [createPortfolioError, setCreatePortfolioError] = useState<string | null>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const createDrawerWidth = useMemo(() => {
    const boundedWidth = Math.min(screenWidth, 1024);
    if (boundedWidth < 560) {
      return boundedWidth;
    }
    return Math.min(boundedWidth * 0.94, 520);
  }, [screenWidth]);

  const createDrawerHeight = useMemo(() => {
    const visibleTopGap = isCompactPortrait ? 72 : 96;
    const preferredHeight = Math.round(screenHeight * (isCompactPortrait ? 0.58 : 0.62));
    return Math.min(preferredHeight, Math.max(screenHeight - visibleTopGap, 320));
  }, [isCompactPortrait, screenHeight]);

  const createDrawerTopInset = useMemo(() => {
    return Math.max(screenHeight - createDrawerHeight, 56);
  }, [createDrawerHeight, screenHeight]);

  const createDrawerLeftInset = useMemo(
    () => Math.max((screenWidth - createDrawerWidth) / 2, 0),
    [createDrawerWidth, screenWidth],
  );

  const onOpenCreatePortfolio = useCallback(() => {
    setCreatePortfolioError(null);
    setIsCreatePortfolioModalOpen(true);
  }, []);

  const upsertPortfolioInList = useCallback((portfolio: PortfolioSummary) => {
    setPortfolios((previous) => {
      const withoutCurrent = previous.filter((item) => item.id !== portfolio.id);
      return [portfolio, ...withoutCurrent];
    });
  }, []);

  const onLogoutPress = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout]);

  const onOpenPortfolio = useCallback((portfolio: PortfolioSummary) => {
    router.push({
      pathname: "/portfolio/[id]",
      params: { id: portfolio.id, name: portfolio.name },
    } as never);
  }, []);

  const onConfirmCreatePortfolio = useCallback(async () => {
    const name = newPortfolioName.trim();
    setCreatePortfolioError(null);

    try {
      setCreatingPortfolio(true);
      const created = await createPortfolio({ name: name || undefined });
      upsertPortfolioInList(created);
      setIsCreatePortfolioModalOpen(false);
      setNewPortfolioName("");
      router.push({
        pathname: "/portfolio/[id]",
        params: { id: created.id, name: created.name },
      } as never);
    } catch {
      setCreatePortfolioError(t("dashboard.createPortfolio.error"));
    } finally {
      setCreatingPortfolio(false);
    }
  }, [newPortfolioName, t, upsertPortfolioInList]);

  const onCancelCreatePortfolio = useCallback(() => {
    setIsCreatePortfolioModalOpen(false);
    setCreatePortfolioError(null);
    setNewPortfolioName("");
  }, []);

  const onTogglePortfolioLock = useCallback(
    async (portfolio: PortfolioSummary, lock: boolean) => {
      try {
        setLockingPortfolioId(portfolio.id);
        const updatedHoldings = await setPortfolioLock(portfolio.id, lock);
        const lockedHoldingsCount = updatedHoldings.filter((holding) => holding.isLocked).length;
        const totalInvested = updatedHoldings.reduce(
          (sum, holding) => sum + holding.quantity * holding.averagePrice,
          0,
        );

        setPortfolios((previous) =>
          previous.map((item) =>
            item.id === portfolio.id
              ? {
                  ...item,
                  holdingsCount: updatedHoldings.length,
                  totalInvested,
                  lockedHoldingsCount,
                  isLocked: updatedHoldings.length > 0 && lockedHoldingsCount === updatedHoldings.length,
                }
              : item,
          ),
        );
      } catch {
        setError(t("portfolio.lockActionError"));
      } finally {
        setLockingPortfolioId(null);
      }
    },
    [t],
  );

  const loadPortfolios = useCallback(async () => {
    try {
      setLoadingPortfolios(true);
      setError(null);
      const response = await getPortfolios();
      setPortfolios(response);
    } catch {
      setError(t("dashboard.errorLoad"));
    } finally {
      setLoadingPortfolios(false);
    }
  }, [t]);

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

  const totalInvested = useMemo(() => portfolios.reduce((sum, p) => sum + p.totalInvested, 0), [portfolios]);

  if (isLoading) {
    return <AuthLoadingScreen message={t("app.validatingSession")} />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={dashboardStyles.screen}>
      <ScrollView
        style={dashboardStyles.scroll}
        contentContainerStyle={dashboardStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={loadingPortfolios} onRefresh={() => void loadPortfolios()} />}
      >
        <View
          style={[
            dashboardStyles.contentWrap,
            isCompactPortrait ? { padding: theme.spacing.sm } : null,
          ]}
        >
          <DashboardHero
            email={email}
            totalInvested={totalInvested}
            isCompactPortrait={isCompactPortrait}
            onLogout={() => void onLogoutPress()}
            onOpenFaq={() => setIsFaqOpen(true)}
          />

          <PortfolioListPanel
            t={t}
            portfolios={portfolios}
            loadingPortfolios={loadingPortfolios}
            error={error}
            creatingPortfolio={creatingPortfolio}
            formatCurrency={formatCurrency}
            onRefresh={() => void loadPortfolios()}
            onCreatePortfolio={onOpenCreatePortfolio}
            onOpenPortfolio={onOpenPortfolio}
            onTogglePortfolioLock={onTogglePortfolioLock}
            lockingPortfolioId={lockingPortfolioId}
          />
        </View>
      </ScrollView>

      <CreatePortfolioDrawer
        visible={isCreatePortfolioModalOpen}
        isCompactPortrait={isCompactPortrait}
        createDrawerWidth={createDrawerWidth}
        createDrawerHeight={createDrawerHeight}
        createDrawerTopInset={createDrawerTopInset}
        createDrawerLeftInset={createDrawerLeftInset}
        newPortfolioName={newPortfolioName}
        onChangeName={setNewPortfolioName}
        createPortfolioError={createPortfolioError}
        creatingPortfolio={creatingPortfolio}
        t={t}
        onCancel={onCancelCreatePortfolio}
        onConfirm={() => void onConfirmCreatePortfolio()}
      />

      <FaqBottomSheet visible={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
    </View>
  );
}
