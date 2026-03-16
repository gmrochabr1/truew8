import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { DSButton } from '@/src/components/common/DSButton';
import { DSInput } from '@/src/components/common/DSInput';
import { DSText } from '@/src/components/common/DSText';
import { setPortfolioVaultKeyGetter } from '@/src/services/portfolio';
import { useVault } from '@/src/store/VaultContext';
import { theme } from '@/src/theme/tokens';

type VaultGuardProps = {
  email: string;
  children: React.ReactNode;
};

export function VaultGuard({ email, children }: VaultGuardProps) {
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
        setError('Biometria nao validada. Digite seu PIN de 6 digitos.');
      }
    })();
  }, [biometricEnabled, email, rememberPin, state, unlockWithBiometrics]);

  const isCreationMode = state === 'needs-pin-creation';
  const isEntryMode = state === 'needs-pin-entry';

  const canToggleBiometric = useMemo(() => {
    return rememberOnDevice && biometricAvailable && Platform.OS !== 'web';
  }, [biometricAvailable, rememberOnDevice]);

  const submitLabel = isCreationMode ? 'Criar Cofre' : 'Desbloquear Cofre';

  const onSubmit = async () => {
    setError(null);
    if (!/^\d{6}$/.test(pin)) {
      setError('Digite um PIN numerico de 6 digitos.');
      return;
    }

    if (isCreationMode && pin !== confirmPin) {
      setError('A confirmacao do PIN nao confere.');
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
      setError('Nao foi possivel validar o PIN do cofre.');
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
        <DSText style={styles.title}>{isCreationMode ? 'Configurar Cofre' : 'Desbloquear Cofre'}</DSText>
        <DSText style={styles.subtitle}>
          Seus dados financeiros sao criptografados no seu dispositivo. O TrueW8 nao tem acesso a sua carteira. Nos nao guardamos o seu PIN. Se voce o esquecer, nao sera possivel recuperar os dados atuais da sua carteira e voce precisara recomecar do zero.
        </DSText>

        {isEntryMode && rememberPin && biometricEnabled && biometricAvailable && Platform.OS !== 'web' ? (
          <DSButton
            title={isBusy ? 'Validando biometria...' : 'Entrar com Biometria'}
            onPress={() => {
              void (async () => {
                setError(null);
                setIsBusy(true);
                const unlocked = await unlockWithBiometrics(email);
                setIsBusy(false);
                if (!unlocked) {
                  setError('Biometria nao validada. Digite seu PIN de 6 digitos.');
                }
              })();
            }}
            disabled={isBusy}
            testID="vault-biometric-button"
          />
        ) : null}

        <DSInput
          label="PIN do Cofre (6 digitos)"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          testID="vault-pin-input"
        />

        {isCreationMode ? (
          <DSInput
            label="Confirmar PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            secureTextEntry
            testID="vault-pin-confirm-input"
          />
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <DSText style={styles.switchLabel}>Lembrar meu PIN neste dispositivo</DSText>
            <DSText style={styles.switchHint}>Quando desativado, a chave fica somente em memoria ate fechar o app.</DSText>
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
            <DSText style={styles.switchLabel}>Habilitar Biometria (FaceID/Digital)</DSText>
            <DSText style={styles.switchHint}>
              A biometria autentica localmente para liberar a chave salva. O PIN continua sendo sua chave mestre.
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
          title={isBusy ? 'Processando...' : submitLabel}
          onPress={() => void onSubmit()}
          disabled={isBusy || state === 'loading' || state === 'idle'}
          testID="vault-submit-button"
        />

        {state === 'loading' ? <DSText style={styles.loading}>Preparando cofre...</DSText> : null}
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
