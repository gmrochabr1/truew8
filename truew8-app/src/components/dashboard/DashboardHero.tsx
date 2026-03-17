import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useRef, useState } from "react";
import { Image, Pressable, View } from "react-native";

import { DSText } from "@/src/components/common/DSText";
import { SupportedLocale } from "@/src/i18n";
import { useLocale } from "@/src/store/LocaleContext";

import { LocalePopover } from "./LocalePopover";
import { dashboardStyles } from "./styles";
import { UserCustomizationMenu } from "./UserCustomizationMenu";

type DashboardHeroProps = {
  email: string | null;
  totalInvested: number;
  isCompactPortrait: boolean;
  onLogout: () => void;
};

export const DashboardHero = memo(function DashboardHero({
  email,
  totalInvested,
  isCompactPortrait,
  onLogout,
}: DashboardHeroProps) {
  const { t, locale, setLocale, availableLocales, formatCurrency } =
    useLocale();

  const localeTriggerRef = useRef<View>(null);
  const userTriggerRef = useRef<View>(null);

  const [isLocaleOpen, setIsLocaleOpen] = useState(false);
  const [localeAnchor, setLocaleAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userAnchor, setUserAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const labels: Record<SupportedLocale, string> = {
    "pt-BR": t("locale.pt-BR"),
    "en-US": t("locale.en-US"),
  };

  const toggleLocalePopover = useCallback(() => {
    if (isLocaleOpen) {
      setIsLocaleOpen(false);
      return;
    }

    localeTriggerRef.current?.measureInWindow((left, top, width, height) => {
      setLocaleAnchor({ left, top, width, height });
      setIsUserMenuOpen(false);
      setIsLocaleOpen(true);
    });
  }, [isLocaleOpen]);

  const openUserMenu = useCallback(() => {
    userTriggerRef.current?.measureInWindow((left, top, width, height) => {
      setUserAnchor({ left, top, width, height });
      setIsLocaleOpen(false);
      setIsUserMenuOpen(true);
    });
  }, []);

  const handleLocaleSelect = useCallback(
    async (nextLocale: SupportedLocale) => {
      setIsLocaleOpen(false);
      await setLocale(nextLocale);
    },
    [setLocale],
  );

  return (
    <View style={dashboardStyles.heroContainer}>
      <View style={dashboardStyles.heroLogoBadge}>
        <Image
          source={require("../../../assets/images/TrueW8-Logo-No-Background.png")}
          style={
            isCompactPortrait
              ? dashboardStyles.heroLogoMobile
              : dashboardStyles.heroLogo
          }
          resizeMode="contain"
        />
      </View>
      <View style={dashboardStyles.hero}>
        <View
          style={[
            dashboardStyles.heroTopRow,
            isCompactPortrait ? dashboardStyles.heroTopRowCompact : null,
          ]}
        >
          <View style={dashboardStyles.heroIdentityRow}>
            <View
              style={[
                dashboardStyles.heroTitleWrap,
                isCompactPortrait ? dashboardStyles.heroTitleWrapCompact : null,
              ]}
            >
              <DSText
                style={[
                  dashboardStyles.title,
                  isCompactPortrait ? dashboardStyles.titleMobile : null,
                ]}
              >
                {t("dashboard.title")}
              </DSText>
            </View>
          </View>

          <View
            style={[
              dashboardStyles.heroControlsColumn,
              isCompactPortrait
                ? dashboardStyles.heroControlsColumnCompact
                : null,
            ]}
          >
            <View style={[dashboardStyles.heroActionsRow]}>
              <View ref={userTriggerRef} collapsable={false}>
                <Pressable
                  style={[
                    dashboardStyles.heroActionButton,
                    dashboardStyles.heroUserButton,
                  ]}
                  onPress={openUserMenu}
                  testID="dashboard-user-menu-trigger"
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={18}
                    color="#EDF3FB"
                  />
                  <DSText style={dashboardStyles.heroActionLabel}>
                    {t("dashboard.preferences.button")}
                  </DSText>
                </Pressable>
              </View>

              <View ref={localeTriggerRef} collapsable={false}>
                <Pressable
                  style={[
                    dashboardStyles.heroActionButton,
                    dashboardStyles.localeMenuTrigger,
                    isLocaleOpen
                      ? dashboardStyles.localeMenuTriggerActive
                      : null,
                  ]}
                  onPress={toggleLocalePopover}
                  testID="dashboard-locale-menu-trigger"
                >
                  <DSText style={dashboardStyles.localeFlag}>
                    {locale === "pt-BR" ? "🇧🇷" : "🇺🇸"}
                  </DSText>
                  <Ionicons
                    name={isLocaleOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#EDF3FB"
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={onLogout}
                style={[
                  dashboardStyles.heroActionButton,
                  dashboardStyles.heroLogoutButton,
                ]}
                testID="dashboard-header-logout"
              >
                <Ionicons name="log-out-outline" size={18} color="#EDF3FB" />
                {!isCompactPortrait ? (
                  <DSText style={dashboardStyles.heroActionLabel}>
                    {t("dashboard.logout")}
                  </DSText>
                ) : null}
              </Pressable>
            </View>

            <View style={dashboardStyles.totalChip}>
              <DSText style={dashboardStyles.totalLabel}>
                {t("dashboard.totalInvested")}
              </DSText>
              <DSText style={dashboardStyles.totalValue}>
                {formatCurrency(totalInvested)}
              </DSText>
            </View>
          </View>
        </View>

        <LocalePopover
          visible={isLocaleOpen}
          anchorLayout={localeAnchor}
          availableLocales={availableLocales}
          locale={locale}
          labels={labels}
          onClose={() => setIsLocaleOpen(false)}
          onSelect={(next) => void handleLocaleSelect(next)}
        />

        <UserCustomizationMenu
          visible={isUserMenuOpen}
          anchorLayout={userAnchor}
          email={email}
          onClose={() => setIsUserMenuOpen(false)}
        />
      </View>
    </View>
  );
});
