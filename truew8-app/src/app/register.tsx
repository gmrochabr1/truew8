import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { getAuthErrorMessageKey } from '@/src/services/authErrors';
import { useAuth } from '@/src/store/AuthContext';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

export default function RegisterScreen() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard' as never);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return <AuthLoadingScreen message={t('app.validatingSession')} />;
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
      router.replace('/login' as never);
    } catch (submitError) {
      setError(t(getAuthErrorMessageKey(submitError, 'register')));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bandTop} />
      <View style={styles.bandBottom} />

      <View style={styles.contentWrap}>
        <View style={styles.card}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../../assets/images/TrueW8-Logo-No-Background.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            testID="register-password-input"
            rightElement={
              <Pressable
                onPress={() => setIsPasswordVisible((current) => !current)}
                testID="register-password-visibility-toggle"
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

          <DSButton title={t('auth.register')} onPress={onSubmit} testID="register-submit-button" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => router.push('/login')} testID="go-to-login-link">
            <Text style={styles.link}>{t('auth.haveAccount')}</Text>
          </Pressable>
        </View>
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
  contentWrap: {
    width: '100%',
    maxWidth: 1024,
    alignItems: 'center',
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
    width: '100%',
    maxWidth: 280,
    borderRadius: 18,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#D6E0EF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: 86,
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
  passwordVisibilityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
