import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AuthLoadingScreen } from "@/src/components/common/AuthLoadingScreen";
import { DSButton } from "@/src/components/common/DSButton";
import { DSInput } from "@/src/components/common/DSInput";
import { getAuthErrorMessageKey } from "@/src/services/authErrors";
import { useAuth } from "@/src/store/AuthContext";
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const isCompact = viewportWidth < 640;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard" as never);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return <AuthLoadingScreen message={t('app.validatingSession')} />;
  }

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError(t("auth.errorInvalidData"));
      return;
    }

    try {
      await login(email, password);
      router.replace("/dashboard" as never);
    } catch (submitError) {
      setError(t(getAuthErrorMessageKey(submitError, "login")));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundBase} />
      <View style={[styles.orbit, styles.orbitTopLeft]} />
      <View style={[styles.orbit, styles.orbitBottomRight]} />
      <View style={styles.gridBand} />
      <Image
        source={require("../../assets/images/TrueW8-Symbol-No-Background.png")}
        style={styles.backgroundSymbol}
        resizeMode="contain"
      />

      <View style={styles.contentWrap}>
        <View style={styles.card}>
          <View style={styles.logoPanel}>
            <Image
              source={require("../../assets/images/TrueW8-Logo-No-Background.png")}
              style={[styles.logoImage, isCompact ? styles.logoImageCompact : null]}
              resizeMode="contain"
            />
          </View>

          <DSInput
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            maxLength={160}
            testID="login-email-input"
          />
          <DSInput
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            maxLength={72}
            testID="login-password-input"
            rightElement={
              <Pressable
                onPress={() => setIsPasswordVisible((current) => !current)}
                testID="login-password-visibility-toggle"
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? t('auth.passwordVisibility.hide') : t('auth.passwordVisibility.show')}
                style={styles.passwordVisibilityButton}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            }
          />

          <DSButton
            title={t("auth.login")}
            onPress={onSubmit}
            testID="login-submit-button"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => router.push("/register")}
            testID="go-to-register-link"
          >
            <Text style={styles.link}>{t("auth.noAccount")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    overflow: "hidden",
  },
  contentWrap: {
    width: "100%",
    maxWidth: 1024,
    alignItems: "center",
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EAF1FD",
  },
  orbit: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  orbitTopLeft: {
    width: 360,
    height: 360,
    top: -90,
    left: -120,
    backgroundColor: "#D5E3FA",
    borderColor: "#B4C8E9",
  },
  orbitBottomRight: {
    width: 420,
    height: 420,
    bottom: -120,
    right: -140,
    backgroundColor: "#E2F2E9",
    borderColor: "#BBDCCB",
  },
  gridBand: {
    position: "absolute",
    width: 680,
    height: 240,
    top: "56%",
    left: "50%",
    transform: [{ translateX: -340 }, { rotate: "-8deg" }],
    backgroundColor: "#F6FAFF",
    borderWidth: 1,
    borderColor: "#D8E4F5",
    opacity: 0.85,
  },
  backgroundSymbol: {
    position: "absolute",
    width: 320,
    height: 320,
    top: "50%",
    left: "50%",
    marginLeft: -160,
    marginTop: -200,
    opacity: 0.08,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    gap: theme.spacing.md,
    borderRadius: 22,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...Platform.select({
      web: { boxShadow: "0 18px 44px rgba(12, 39, 77, 0.14)" as never },
      default: {},
    }),
  },
  logoPanel: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 280,
    borderRadius: 18,
    backgroundColor: "#F5F9FF",
    borderWidth: 1,
    borderColor: "#C7D6EC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 10px 24px rgba(14, 40, 78, 0.12)" as never },
      default: {},
    }),
  },
  logoImage: {
    width: "100%",
    height: 120,
  },
  logoImageCompact: {
    height: 98,
  },
  title: {
    fontSize: 30,
    color: theme.colors.textPrimary,
    fontWeight: "800",
    textAlign: "center",
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    color: theme.colors.danger,
    fontWeight: "700",
    textAlign: "center",
  },
  passwordVisibilityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
