import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { setPortfolioVaultKeyGetter } from '@/src/services/portfolio';
import { useLocale } from '@/src/store/LocaleContext';
import { useVault } from '@/src/store/VaultContext';
import { theme } from '@/src/theme/tokens';

type VaultGuardProps = {
  email: string;
  children: React.ReactNode;
};

export function VaultGuard({ email, children }: VaultGuardProps) {
  const { t } = useLocale();
  const {
    state,
    isReady,
    rememberPin,
    biometricEnabled,
    biometricAvailable,
    bootstrapForUser,
    createVaultPin,
    unlockWithPin,
    unlockWithBiometrics,
    getActiveKeyForUser,
  } = useVault();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [rememberOnDevice, setRememberOnDevice] = useState(rememberPin);
  const [enableBiometric, setEnableBiometric] = useState(biometricEnabled);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrapForUser(email);
  }, [bootstrapForUser, email]);

  useEffect(() => {
    setRememberOnDevice(rememberPin);
  }, [rememberPin]);

  useEffect(() => {
    setEnableBiometric(biometricEnabled);
  }, [biometricEnabled]);

  useEffect(() => {
    setPortfolioVaultKeyGetter(() => getActiveKeyForUser(email));
    return () => {
      setPortfolioVaultKeyGetter(() => null);
    };
  }, [email, getActiveKeyForUser, state]);

  useEffect(() => {
    if (state !== 'needs-pin-entry') {
      return;
    }

    if (!rememberPin || !biometricEnabled) {
      return;
    }

    void (async () => {
      setIsBusy(true);
      const unlocked = await unlockWithBiometrics(email);
      setIsBusy(false);
      if (!unlocked) {
        setError(t('vault.errorBiometricFailed'));
      }
    })();
  }, [biometricEnabled, email, rememberPin, state, t, unlockWithBiometrics]);

  const isCreationMode = state === 'needs-pin-creation';
  const isEntryMode = state === 'needs-pin-entry';

  const canToggleBiometric = useMemo(() => {
    return rememberOnDevice && biometricAvailable && Platform.OS !== 'web';
  }, [biometricAvailable, rememberOnDevice]);

  const submitLabel = isCreationMode ? t('vault.createButton') : t('vault.unlockButton');

  const onSubmit = async () => {
    setError(null);
    if (!/^\d{6}$/.test(pin)) {
      setError(t('vault.errorInvalidPin'));
      return;
    }

    if (isCreationMode && pin !== confirmPin) {
      setError(t('vault.errorPinMismatch'));
      return;
    }

    try {
      setIsBusy(true);
      if (isCreationMode) {
        await createVaultPin(email, pin, rememberOnDevice, enableBiometric && canToggleBiometric);
      } else {
        await unlockWithPin(email, pin, rememberOnDevice, enableBiometric && canToggleBiometric);
      }
      setPin('');
      setConfirmPin('');
    } catch {
      setError(t('vault.errorValidation'));
    } finally {
      setIsBusy(false);
    }
  };

  if (isReady) {
    return <>{children}</>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <DSText style={styles.title}>{isCreationMode ? t('vault.setupTitle') : t('vault.unlockTitle')}</DSText>
        <DSText style={styles.subtitle}>
          {t('vault.description')}
        </DSText>

        {isEntryMode && rememberPin && biometricEnabled && biometricAvailable && Platform.OS !== 'web' ? (
          <DSButton
            title={isBusy ? t('vault.biometricValidating') : t('vault.biometricLogin')}
            onPress={() => {
              void (async () => {
                setError(null);
                setIsBusy(true);
                const unlocked = await unlockWithBiometrics(email);
                setIsBusy(false);
                if (!unlocked) {
                  setError(t('vault.errorBiometricFailed'));
                }
              })();
            }}
            disabled={isBusy}
            testID="vault-biometric-button"
          />
        ) : null}

        <DSInput
          label={t('vault.pinLabel')}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          testID="vault-pin-input"
        />

        {isCreationMode ? (
          <DSInput
            label={t('vault.pinConfirmLabel')}
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            secureTextEntry
            testID="vault-pin-confirm-input"
          />
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <DSText style={styles.switchLabel}>{t('vault.rememberLabel')}</DSText>
            <DSText style={styles.switchHint}>{t('vault.rememberHint')}</DSText>
          </View>
          <Switch
            value={rememberOnDevice}
            onValueChange={(next) => {
              setRememberOnDevice(next);
              if (!next) {
                setEnableBiometric(false);
              }
            }}
            testID="vault-remember-switch"
          />
        </View>

        <View style={[styles.switchRow, !canToggleBiometric ? styles.switchRowDisabled : null]}>
          <View style={styles.switchTextWrap}>
            <DSText style={styles.switchLabel}>{t('vault.biometricLabel')}</DSText>
            <DSText style={styles.switchHint}>
              {t('vault.biometricHint')}
            </DSText>
          </View>
          <Switch
            value={enableBiometric}
            onValueChange={setEnableBiometric}
            disabled={!canToggleBiometric}
            testID="vault-biometric-switch"
          />
        </View>

        {error ? <DSText style={styles.error}>{error}</DSText> : null}

        <DSButton
          title={isBusy ? t('vault.processing') : submitLabel}
          onPress={() => void onSubmit()}
          disabled={isBusy || state === 'loading' || state === 'idle'}
          testID="vault-submit-button"
        />

        {state === 'loading' ? <DSText style={styles.loading}>{t('vault.preparing')}</DSText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 16px 38px rgba(12, 39, 77, 0.14)' as never },
      default: {},
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRowDisabled: {
    opacity: 0.55,
  },
  switchTextWrap: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  switchHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  loading: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
