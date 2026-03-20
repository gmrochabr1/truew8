import { Ionicons } from "@expo/vector-icons";
import React, { memo, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ConfirmActionModal } from "@/src/components/common/ConfirmActionModal";
import { DSButton } from "@/src/components/common/DSButton";
import { DSText } from "@/src/components/common/DSText";
import { TranslationKey, TranslationParams } from "@/src/i18n";
import { PortfolioSummary } from "@/src/services/portfolio";

import { dashboardStyles } from "./styles";

type PortfolioListPanelProps = {
  t: (key: TranslationKey, params?: TranslationParams) => string;
  portfolios: PortfolioSummary[];
  loadingPortfolios: boolean;
  error: string | null;
  creatingPortfolio: boolean;
  formatCurrency: (value: number) => string;
  onRefresh: () => void;
  onCreatePortfolio: () => void;
  onOpenPortfolio: (portfolio: PortfolioSummary) => void;
  onTogglePortfolioLock: (portfolio: PortfolioSummary, lock: boolean) => Promise<void>;
  lockingPortfolioId?: string | null;
};

export const PortfolioListPanel = memo(function PortfolioListPanel({
  t,
  portfolios,
  loadingPortfolios,
  error,
  creatingPortfolio,
  formatCurrency,
  onRefresh,
  onCreatePortfolio,
  onOpenPortfolio,
  onTogglePortfolioLock,
  lockingPortfolioId,
}: PortfolioListPanelProps) {
  const [pendingLockPortfolio, setPendingLockPortfolio] = useState<PortfolioSummary | null>(null);

  const isLockModalOpen = pendingLockPortfolio !== null;

  const nextLockState = useMemo(() => {
    if (!pendingLockPortfolio) {
      return true;
    }
    return !Boolean(pendingLockPortfolio.isLocked);
  }, [pendingLockPortfolio]);

  const lockModalTitle = nextLockState
    ? t("portfolio.lockModalTitle")
    : t("portfolio.unlockModalTitle");

  const lockModalMessage = nextLockState
    ? t("portfolio.lockPortfolioMessage")
    : t("portfolio.unlockPortfolioMessage");

  const lockConfirmLabel = nextLockState
    ? t("portfolio.lockPortfolioConfirm")
    : t("portfolio.unlockPortfolioConfirm");

  const closeLockModal = () => {
    if (lockingPortfolioId) {
      return;
    }
    setPendingLockPortfolio(null);
  };

  const onConfirmLockModal = async () => {
    if (!pendingLockPortfolio) {
      return;
    }
    await onTogglePortfolioLock(pendingLockPortfolio, nextLockState);
    setPendingLockPortfolio(null);
  };

  return (
    <View style={dashboardStyles.panel}>
      <View style={dashboardStyles.panelHeader}>
        <DSText style={dashboardStyles.panelTitle}>{t("dashboard.portfolios")}</DSText>
        <Pressable onPress={onRefresh}>
          <DSText style={dashboardStyles.reload}>{t("common.refresh")}</DSText>
        </Pressable>
      </View>

      {error ? <DSText style={dashboardStyles.error}>{error}</DSText> : null}

      {!loadingPortfolios && portfolios.length === 0 ? (
        <View style={dashboardStyles.emptyWrap}>
          <DSText style={dashboardStyles.emptyText}>{t("dashboard.empty")}</DSText>
          <DSButton
            title={t("dashboard.createFirst")}
            onPress={onCreatePortfolio}
            disabled={creatingPortfolio}
            testID="dashboard-create-first-portfolio"
          />
        </View>
      ) : null}

      {portfolios.map((portfolio) => (
        <Pressable
          key={portfolio.id}
          style={[
            dashboardStyles.portfolioCard,
            portfolio.isLocked ? dashboardStyles.portfolioCardLocked : null,
          ]}
          onPress={() => onOpenPortfolio(portfolio)}
          testID={`portfolio-card-${portfolio.id}`}
        >
          <View style={dashboardStyles.portfolioTitleRow}>
            <DSText style={dashboardStyles.portfolioTitle}>{portfolio.name}</DSText>
            {portfolio.holdingsCount > 0 ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setPendingLockPortfolio(portfolio);
                }}
                style={({ pressed }) => [
                  dashboardStyles.portfolioLockButton,
                  pressed ? dashboardStyles.portfolioLockButtonPressed : null,
                ]}
                testID={`portfolio-lock-toggle-${portfolio.id}`}
              >
                <Ionicons
                  name={portfolio.isLocked ? "lock-closed" : "lock-open-outline"}
                  size={15}
                  color={portfolio.isLocked ? "#456084" : "#5B7496"}
                />
              </Pressable>
            ) : null}
          </View>
          <DSText style={dashboardStyles.portfolioDesc}>{portfolio.description ?? t("dashboard.defaultDescription")}</DSText>
          {portfolio.isLocked ? (
            <DSText style={dashboardStyles.portfolioLockedHint}>{t("portfolio.lockedHint")}</DSText>
          ) : null}
          <View style={dashboardStyles.portfolioMetaRow}>
            <DSText style={dashboardStyles.metaText}>
              {t("dashboard.assetsCount", {
                count: portfolio.holdingsCount,
              })}
            </DSText>
            <DSText style={dashboardStyles.metaValue}>{formatCurrency(portfolio.totalInvested)}</DSText>
          </View>
        </Pressable>
      ))}

      {!loadingPortfolios ? (
        <Pressable
          style={dashboardStyles.createPortfolioCard}
          onPress={onCreatePortfolio}
          testID="dashboard-create-portfolio-card"
        >
          <DSText style={dashboardStyles.createPortfolioCardText}>{t("dashboard.createNew")}</DSText>
        </Pressable>
      ) : null}

      <ConfirmActionModal
        visible={isLockModalOpen}
        title={lockModalTitle}
        message={lockModalMessage}
        confirmLabel={lockConfirmLabel}
        busyConfirmLabel={t("common.saving")}
        onConfirm={() => void onConfirmLockModal()}
        onCancel={closeLockModal}
        isBusy={Boolean(lockingPortfolioId)}
        testID="portfolio-lock-modal"
      />
    </View>
  );
});
