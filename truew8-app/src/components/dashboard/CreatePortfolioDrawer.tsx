import React, { memo } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { DSButton } from "@/src/components/common/DSButton";
import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { TranslationKey } from "@/src/i18n";

import { dashboardStyles } from "./styles";

type CreatePortfolioDrawerProps = {
  isRendered: boolean;
  isCompactPortrait: boolean;
  createBackdropOpacity: Animated.Value;
  createDrawerTranslate: Animated.Value;
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
  isRendered,
  isCompactPortrait,
  createBackdropOpacity,
  createDrawerTranslate,
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
  if (!isRendered) {
    return null;
  }

  return (
    <View style={dashboardStyles.createDrawerRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            opacity: createBackdropOpacity,
            zIndex: 20,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <Animated.View
        testID="dashboard-create-portfolio-drawer"
        style={[
          dashboardStyles.createDrawerShell,
          dashboardStyles.createDrawerShellBottomSheet,
          dashboardStyles.createDrawerShadowTop,
          {
            width: createDrawerWidth,
            height: createDrawerHeight,
            top: createDrawerTopInset,
            left: createDrawerLeftInset,
            transform: [{ translateY: createDrawerTranslate }] as any,
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
      </Animated.View>
    </View>
  );
});
