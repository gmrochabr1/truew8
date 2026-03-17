import React, { memo, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { DSAutocomplete } from "@/src/components/common/DSAutocomplete/DSAutocomplete";
import { DSButton } from "@/src/components/common/DSButton";
import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { getDecimalSeparator, maskNumericInput, parseLocaleNumber } from "@/src/services/numericInput";
import {
  UserCustomizationPreference,
  getCustomizationPreferences,
  updateCustomizationPreferences,
} from "@/src/services/preferences";
import { useLocale } from "@/src/store/LocaleContext";

import { dashboardStyles } from "./styles";

type UserCustomizationMenuProps = {
  visible: boolean;
  anchorLayout: { top: number; left: number; width: number; height: number } | null;
  email: string | null;
  onClose: () => void;
};

type Option = {
  id: string;
  label: string;
};

const defaultState: UserCustomizationPreference = {
  baseCurrency: "BRL",
  toleranceValue: 10,
  allowSells: true,
  theme: "LIGHT",
  availableBaseCurrencies: ["BRL", "USD"],
  availableThemes: ["LIGHT", "DARK"],
};

export const UserCustomizationMenu = memo(function UserCustomizationMenu({
  visible,
  anchorLayout,
  email,
  onClose,
}: UserCustomizationMenuProps) {
  const { t, locale } = useLocale();
  const numberLocale = locale === "en-US" ? "en-US" : "pt-BR";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserCustomizationPreference>(defaultState);
  const [toleranceInput, setToleranceInput] = useState(String(defaultState.toleranceValue));

  useEffect(() => {
    if (!visible) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    void getCustomizationPreferences()
      .then((response) => {
        if (!mounted) {
          return;
        }
        setPrefs(response);
        const decimalSeparator = getDecimalSeparator(numberLocale);
        setToleranceInput(String(response.toleranceValue).replace(".", decimalSeparator));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError(t("dashboard.preferences.loadError"));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [numberLocale, t, visible]);

  const baseCurrencyOptions = useMemo<Option[]>(
    () => prefs.availableBaseCurrencies.map((value) => ({ id: value, label: value })),
    [prefs.availableBaseCurrencies],
  );

  const themeOptions = useMemo<Option[]>(
    () =>
      prefs.availableThemes.map((value) => ({
        id: value,
        label: value === "DARK" ? t("dashboard.preferences.theme.dark") : t("dashboard.preferences.theme.light"),
      })),
    [prefs.availableThemes, t],
  );

  if (!visible || !anchorLayout) {
    return null;
  }

  const top = anchorLayout.top + anchorLayout.height + 6;

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const parsedTolerance = parseLocaleNumber(toleranceInput, numberLocale);

    try {
      const updated = await updateCustomizationPreferences({
        baseCurrency: prefs.baseCurrency,
        toleranceValue: Number.isFinite(parsedTolerance) ? parsedTolerance : 10,
        allowSells: prefs.allowSells,
        theme: prefs.theme,
      });
      setPrefs(updated);
      const decimalSeparator = getDecimalSeparator(numberLocale);
      setToleranceInput(String(updated.toleranceValue).replace(".", decimalSeparator));
      onClose();
    } catch {
      setError(t("dashboard.preferences.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={dashboardStyles.popoverRoot} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} testID="dashboard-user-menu-backdrop" />
        <View
          style={[
            dashboardStyles.popoverCard,
            {
              top,
              left: Math.max(anchorLayout.left - 240 + anchorLayout.width, 8),
            },
          ]}
          testID="dashboard-user-menu-popover"
        >
          <View style={dashboardStyles.userMenuContent}>
            <DSText style={dashboardStyles.userMenuTitle}>{t("dashboard.preferences.title")}</DSText>
            <DSText style={dashboardStyles.userMenuEmail}>{email ?? t("dashboard.userFallback")}</DSText>

            {loading ? <DSText>{t("common.loading")}</DSText> : null}

            {!loading ? (
              <>
                <DSAutocomplete<Option>
                  label={t("dashboard.preferences.baseCurrency")}
                  items={baseCurrencyOptions}
                  idField="id"
                  displayField="label"
                  value={prefs.baseCurrency}
                  onChange={(value: string | string[]) => {
                    if (typeof value === "string") {
                      setPrefs((current) => ({ ...current, baseCurrency: value as "BRL" | "USD" }));
                    }
                  }}
                  testID="dashboard-pref-base-currency"
                />

                <DSInput
                  label={t("dashboard.preferences.tolerance")}
                  value={toleranceInput}
                  onChangeText={(value) => {
                    const maskedValue = maskNumericInput(value, { locale: numberLocale, maxFractionDigits: 2 });
                    const numericValue = parseLocaleNumber(maskedValue, numberLocale);
                    setToleranceInput(maskedValue);
                    setPrefs((current) => ({
                      ...current,
                      toleranceValue: Number.isFinite(numericValue) ? numericValue : 0,
                    }));
                  }}
                  keyboardType="decimal-pad"
                  maxLength={6}
                  testID="dashboard-pref-tolerance"
                />

                <View style={dashboardStyles.toggleRow}>
                  <DSText style={dashboardStyles.toggleText}>{t("dashboard.preferences.allowSells")}</DSText>
                  <Pressable
                    style={[
                      dashboardStyles.switchPill,
                      prefs.allowSells ? dashboardStyles.switchPillOn : dashboardStyles.switchPillOff,
                    ]}
                    onPress={() => setPrefs((current) => ({ ...current, allowSells: !current.allowSells }))}
                    testID="dashboard-pref-allow-sells"
                  >
                    <DSText style={dashboardStyles.switchText}>{prefs.allowSells ? "ON" : "OFF"}</DSText>
                  </Pressable>
                </View>

                <DSAutocomplete<Option>
                  label={t("dashboard.preferences.theme")}
                  items={themeOptions}
                  idField="id"
                  displayField="label"
                  value={prefs.theme}
                  onChange={(value: string | string[]) => {
                    if (typeof value === "string") {
                      setPrefs((current) => ({ ...current, theme: value as "LIGHT" | "DARK" }));
                    }
                  }}
                  testID="dashboard-pref-theme"
                />

                {error ? <DSText style={dashboardStyles.error}>{error}</DSText> : null}

                <View style={dashboardStyles.userMenuActions}>
                  <View style={dashboardStyles.userMenuActionButton}>
                    <DSButton title={t("common.cancel")} onPress={onClose} disabled={saving} />
                  </View>
                  <View style={dashboardStyles.userMenuActionButton}>
                    <DSButton
                      title={saving ? t("common.saving") : t("common.save")}
                      onPress={() => void onSave()}
                      disabled={saving}
                      testID="dashboard-pref-save"
                    />
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
});
