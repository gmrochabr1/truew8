import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { t } from '@/src/i18n';
import { getAuthErrorMessageKey } from '@/src/services/authErrors';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard' as never);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return <AuthLoadingScreen message="Validando sessao..." />;
  }

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.errorInvalidData'));
      return;
    }

    try {
      await login(email, password);
      router.replace('/dashboard' as never);
    } catch (submitError) {
      setError(t(getAuthErrorMessageKey(submitError, 'login')));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.card}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>TRUEW8</Text>
        </View>

        <Text style={styles.title}>{t('auth.loginTitle')}</Text>

        <DSInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          testID="login-email-input"
        />
        <DSInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          testID="login-password-input"
        />

        <DSButton title={t('auth.login')} onPress={onSubmit} testID="login-submit-button" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={() => router.push('/register')} testID="go-to-register-link">
          <Text style={styles.link}>{t('auth.noAccount')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  backgroundGlowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#DCE8FA',
    top: -90,
    left: -70,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#F8EBC8',
    bottom: -120,
    right: -100,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    gap: theme.spacing.md,
    borderRadius: 22,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 18px 44px rgba(12, 39, 77, 0.14)' as never },
      default: {},
    }),
  },
  logoPlaceholder: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#EAF1FE',
    borderWidth: 1,
    borderColor: '#C9D8F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoText: {
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
});
