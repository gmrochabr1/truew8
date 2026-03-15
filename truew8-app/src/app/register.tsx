import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { t } from '@/src/i18n';
import { useAuth } from '@/src/store/AuthContext';
import { theme } from '@/src/theme/tokens';

export default function RegisterScreen() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async () => {
    setError('');
    try {
      await register(email, password);
      router.replace('/');
    } catch {
      setError(t('auth.error'));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.diagonal} />

      <View style={styles.card}>
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
          <Text style={styles.link}>
          {t('auth.haveAccount')}
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
    backgroundColor: '#F4F7EB',
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  diagonal: {
    position: 'absolute',
    width: 480,
    height: 480,
    backgroundColor: '#D6E6C3',
    transform: [{ rotate: '26deg' }],
    top: -180,
    left: -120,
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
      web: { boxShadow: '0 14px 40px rgba(15,52,96,0.14)' as never },
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
});
