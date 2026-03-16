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

export default function RegisterScreen() {
  const { register, isAuthenticated, isLoading } = useAuth();
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

    if (password.length < 8 || password.length > 72) {
      setError(t('auth.errorWeakPassword'));
      return;
    }

    try {
      await register(email, password);
      router.replace('/dashboard' as never);
    } catch (submitError) {
      setError(t(getAuthErrorMessageKey(submitError, 'register')));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bandTop} />
      <View style={styles.bandBottom} />

      <View style={styles.card}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>TRUEW8</Text>
        </View>

        <Text style={styles.title}>{t('auth.registerTitle')}</Text>

        <DSInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          testID="register-email-input"
        />
        <DSInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          testID="register-password-input"
        />

        <DSButton title={t('auth.register')} onPress={onSubmit} testID="register-submit-button" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={() => router.push('/login')} testID="go-to-login-link">
          <Text style={styles.link}>{t('auth.haveAccount')}</Text>
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
  bandTop: {
    position: 'absolute',
    width: 500,
    height: 180,
    backgroundColor: '#E2EDFF',
    transform: [{ rotate: '-8deg' }],
    top: -50,
    left: -60,
  },
  bandBottom: {
    position: 'absolute',
    width: 520,
    height: 180,
    backgroundColor: '#E0F4EA',
    transform: [{ rotate: '8deg' }],
    bottom: -60,
    right: -80,
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
      web: { boxShadow: '0 18px 44px rgba(16, 42, 82, 0.15)' as never },
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
