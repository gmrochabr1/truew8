import React, { memo } from "react";
import { Pressable, View } from "react-native";

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
}: PortfolioListPanelProps) {
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
          style={dashboardStyles.portfolioCard}
          onPress={() => onOpenPortfolio(portfolio)}
          testID={`portfolio-card-${portfolio.id}`}
        >
          <DSText style={dashboardStyles.portfolioTitle}>{portfolio.name}</DSText>
          <DSText style={dashboardStyles.portfolioDesc}>{portfolio.description ?? t("dashboard.defaultDescription")}</DSText>
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
    </View>
  );
});
