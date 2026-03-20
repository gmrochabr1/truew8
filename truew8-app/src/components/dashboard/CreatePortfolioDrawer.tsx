import React, { memo } from "react";
import { ScrollView, View } from "react-native";

import { DSButton } from "@/src/components/common/DSButton";
import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { SlidingBottomSheet } from "@/src/components/common/SlidingBottomSheet";
import { TranslationKey } from "@/src/i18n";

import { dashboardStyles } from "./styles";

type CreatePortfolioDrawerProps = {
  visible: boolean;
  isCompactPortrait: boolean;
  createDrawerWidth: number;
  createDrawerHeight: number;
  createDrawerTopInset: number;
  createDrawerLeftInset: number;
  newPortfolioName: string;
  onChangeName: (value: string) => void;
  createPortfolioError: string | null;
  creatingPortfolio: boolean;
  t: (key: TranslationKey) => string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const CreatePortfolioDrawer = memo(function CreatePortfolioDrawer({
  visible,
  isCompactPortrait,
  createDrawerWidth,
  createDrawerHeight,
  createDrawerTopInset,
  createDrawerLeftInset,
  newPortfolioName,
  onChangeName,
  createPortfolioError,
  creatingPortfolio,
  t,
  onCancel,
  onConfirm,
}: CreatePortfolioDrawerProps) {
  return (
    <SlidingBottomSheet
      visible={visible}
      onClose={onCancel}
      testID="dashboard-create-portfolio-drawer"
      sheetStyle={[
        dashboardStyles.createDrawerShell,
        dashboardStyles.createDrawerShellBottomSheet,
        dashboardStyles.createDrawerShadowTop,
        {
          width: createDrawerWidth,
          height: createDrawerHeight,
          top: createDrawerTopInset,
          left: createDrawerLeftInset,
        },
      ]}
    >
      <ScrollView style={dashboardStyles.createDrawerScroll} contentContainerStyle={dashboardStyles.createDrawerContent}>
        <DSText style={dashboardStyles.createDrawerTitle}>{t("dashboard.createPortfolio.title")}</DSText>
        <DSInput
          label={t("dashboard.createPortfolio.name")}
          value={newPortfolioName}
          onChangeText={onChangeName}
          placeholder={t("dashboard.createPortfolio.placeholder")}
          maxLength={80}
          testID="dashboard-create-portfolio-name"
        />

        {createPortfolioError ? <DSText style={dashboardStyles.error}>{createPortfolioError}</DSText> : null}

        <View
          style={[
            dashboardStyles.createDrawerActions,
            isCompactPortrait ? dashboardStyles.createDrawerActionsMobile : null,
          ]}
        >
          <View style={dashboardStyles.createDrawerActionSlot}>
            <DSButton title={t("common.cancel")} onPress={onCancel} />
          </View>
          <View style={dashboardStyles.createDrawerActionSlot}>
            <DSButton
              title={creatingPortfolio ? t("dashboard.createPortfolio.creating") : t("dashboard.createPortfolio.confirm")}
              onPress={onConfirm}
              testID="dashboard-create-portfolio-confirm"
              disabled={creatingPortfolio}
            />
          </View>
        </View>
      </ScrollView>
    </SlidingBottomSheet>
  );
});
