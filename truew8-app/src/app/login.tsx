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
      router.replace('/');
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
      router.replace('/');
    } catch (submitError) {
      setError(t(getAuthErrorMessageKey(submitError, 'login')));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.shapeTop} />
      <View style={styles.shapeBottom} />

      <View style={styles.card}>
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
          <Text style={styles.link}>
          {t('auth.noAccount')}
          </Text>
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
  card: {
    width: '100%',
    maxWidth: 440,
    gap: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 14px 40px rgba(20,33,61,0.12)' as never },
      default: {},
    }),
  },
  title: {
    fontSize: 30,
    color: theme.colors.textPrimary,
    fontWeight: '800',
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
  shapeTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#BFE0E5',
    top: -70,
    right: -60,
  },
  shapeBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F2D9C3',
    bottom: -90,
    left: -80,
  },
});
