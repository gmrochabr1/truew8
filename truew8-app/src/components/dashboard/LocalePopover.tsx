import React, { memo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { DSText } from "@/src/components/common/DSText";
import { SupportedLocale } from "@/src/i18n";

import { dashboardStyles } from "./styles";

type LocalePopoverProps = {
  visible: boolean;
  availableLocales: SupportedLocale[];
  locale: SupportedLocale;
  labels: Record<SupportedLocale, string>;
  anchorLayout: { top: number; left: number; width: number; height: number } | null;
  onClose: () => void;
  onSelect: (locale: SupportedLocale) => void;
};

const localeFlags: Record<SupportedLocale, string> = {
  "pt-BR": "🇧🇷",
  "en-US": "🇺🇸",
};

export const LocalePopover = memo(function LocalePopover({
  visible,
  availableLocales,
  locale,
  labels,
  anchorLayout,
  onClose,
  onSelect,
}: LocalePopoverProps) {
  if (!visible || !anchorLayout) {
    return null;
  }

  const popoverTop = anchorLayout.top + anchorLayout.height + 6;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={dashboardStyles.popoverRoot} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} testID="dashboard-locale-popover-backdrop" />
        <View
          style={[
            dashboardStyles.popoverCard,
            {
              top: popoverTop,
              left: Math.max(anchorLayout.left - 58, 8),
            },
          ]}
          testID="dashboard-locale-popover"
        >
          {availableLocales.map((itemLocale) => {
            const isActive = locale === itemLocale;
            return (
              <Pressable
                key={itemLocale}
                style={[dashboardStyles.localeMenuItem, isActive ? dashboardStyles.localeMenuItemActive : null]}
                onPress={() => {
                  onClose();
                  onSelect(itemLocale);
                }}
                testID={itemLocale === "pt-BR" ? "dashboard-locale-ptBR" : "dashboard-locale-enUS"}
              >
                <DSText style={dashboardStyles.localeFlag}>{localeFlags[itemLocale]}</DSText>
                <DSText
                  style={[
                    dashboardStyles.localeMenuItemText,
                    isActive ? dashboardStyles.localeMenuItemTextActive : null,
                  ]}
                >
                  {labels[itemLocale]}
                </DSText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
});
