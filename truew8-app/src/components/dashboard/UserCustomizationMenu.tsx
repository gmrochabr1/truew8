import React, { memo, useEffect, useMemo, useState } from "react";
import { Switch, View } from "react-native";

import { DSButton } from "@/src/components/common/DSButton";
import { DSInfoTooltip } from "@/src/components/common/DSInfoTooltip";
import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { SlidingBottomSheet } from "@/src/components/common/SlidingBottomSheet";
import { getDecimalSeparator, parseLocaleNumber } from "@/src/services/numericInput";
import {
  getAssetLockConfirmationPreference,
  UserCustomizationPreference,
  getCustomizationPreferences,
  updateAssetLockConfirmationPreference,
  updateCustomizationPreferences,
} from "@/src/services/preferences";
import { useLocale } from "@/src/store/LocaleContext";

import { dashboardStyles } from "./styles";

type UserCustomizationMenuProps = {
  visible: boolean;
  email: string | null;
  onClose: () => void;
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
  const [keepAssetLockConfirmation, setKeepAssetLockConfirmation] = useState(false);

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

    void getAssetLockConfirmationPreference(email)
      .then((assetLockPreference) => {
        if (!mounted) {
          return;
        }
        setKeepAssetLockConfirmation(assetLockPreference.keepConfirmationForIndividualAssets);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setKeepAssetLockConfirmation(false);
      });

    return () => {
      mounted = false;
    };
  }, [numberLocale, t, visible]);

  const bastterModeEnabled = useMemo(() => !prefs.allowSells, [prefs.allowSells]);

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
      await updateAssetLockConfirmationPreference(email, {
        keepConfirmationForIndividualAssets: keepAssetLockConfirmation,
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
    <SlidingBottomSheet
      visible={visible}
      onClose={onClose}
      testID="dashboard-user-menu-bottom-sheet"
      sheetStyle={[dashboardStyles.preferencesSheetCard, { bottom: 0 }]}
    >
      <View style={dashboardStyles.preferencesSheetContent}>
        <DSText style={dashboardStyles.preferencesSheetTitle}>{t("dashboard.preferences.title")}</DSText>
        <DSText style={dashboardStyles.preferencesSheetEmail}>{email ?? t("dashboard.userFallback")}</DSText>

        {loading ? <DSText>{t("common.loading")}</DSText> : null}

        {!loading ? (
          <>
            <View style={dashboardStyles.preferencesRowHeader}>
              <DSText style={dashboardStyles.preferencesRowLabel}>
                {t("dashboard.preferences.bastterMode")}
              </DSText>
              <DSInfoTooltip
                text={t("dashboard.preferences.bastterMode.helper")}
                testID="dashboard-pref-bastter-helper"
              />
            </View>

            <View style={dashboardStyles.preferencesSwitchRow}>
              <DSText style={dashboardStyles.preferencesSwitchHint}>
                {bastterModeEnabled
                  ? t("dashboard.preferences.bastterMode.enabled")
                  : t("dashboard.preferences.bastterMode.disabled")}
              </DSText>
              <Switch
                value={bastterModeEnabled}
                onValueChange={(nextValue) => {
                  setPrefs((current) => ({
                    ...current,
                    allowSells: !nextValue,
                  }));
                }}
                testID="dashboard-pref-bastter-mode"
              />
            </View>

            <View style={dashboardStyles.preferencesRowHeader}>
              <DSText style={dashboardStyles.preferencesRowLabel}>
                {t("dashboard.preferences.rebalanceToleranceCurrency")}
              </DSText>
              <DSInfoTooltip
                text={t("dashboard.preferences.rebalanceToleranceCurrency.helper")}
                testID="dashboard-pref-tolerance-helper"
              />
            </View>

            <DSInput
              label={''}
              value={toleranceInput}
              onChangeText={(value) => {
                const numericValue = parseLocaleNumber(value, numberLocale);
                setToleranceInput(value);
                setPrefs((current) => ({
                  ...current,
                  toleranceValue: Number.isFinite(numericValue) ? numericValue : 0,
                }));
              }}
              keyboardType="decimal-pad"
              maxLength={6}
              isValueField
              valueLocale={numberLocale}
              valueMaxFractionDigits={2}
              testID="dashboard-pref-tolerance"
            />

            <View style={dashboardStyles.preferencesRowHeader}>
              <DSText style={dashboardStyles.preferencesRowLabel}>
                {t("dashboard.preferences.keepAssetLockConfirmation")}
              </DSText>
              <DSInfoTooltip
                text={t("dashboard.preferences.keepAssetLockConfirmation.helper")}
                testID="dashboard-pref-lock-confirmation-helper"
              />
            </View>

            <View style={dashboardStyles.preferencesSwitchRow}>
              <DSText style={dashboardStyles.preferencesSwitchHint}>
                {keepAssetLockConfirmation
                  ? t("dashboard.preferences.keepAssetLockConfirmation.enabled")
                  : t("dashboard.preferences.keepAssetLockConfirmation.disabled")}
              </DSText>
              <Switch
                value={keepAssetLockConfirmation}
                onValueChange={setKeepAssetLockConfirmation}
                testID="dashboard-pref-lock-confirmation-mode"
              />
            </View>

            {error ? <DSText style={dashboardStyles.error}>{error}</DSText> : null}

            <View style={dashboardStyles.preferencesSheetActions}>
              <View style={dashboardStyles.preferencesSheetActionButton}>
                <DSButton title={t("common.cancel")} onPress={onClose} disabled={saving} />
              </View>
              <View style={dashboardStyles.preferencesSheetActionButton}>
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
    </SlidingBottomSheet>
  );
});
