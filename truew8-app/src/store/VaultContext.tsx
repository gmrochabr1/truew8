import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  authenticateWithBiometrics,
  buildVaultKeyFingerprint,
  bootstrapVault,
  clearActiveVaultKey,
  clearPersistedVaultKey,
  deriveVaultKeyFromPin,
  getActiveVaultKeyBase64,
  hasActiveVaultKey,
  loadVaultProfile,
  savePersistedVaultKey,
  saveVaultProfile,
  setActiveVaultKey,
} from '@/src/services/cryptoService';

type VaultState = 'idle' | 'loading' | 'unlocked' | 'needs-pin-creation' | 'needs-pin-entry';

type VaultContextValue = {
  state: VaultState;
  isReady: boolean;
  rememberPin: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  bootstrapForUser: (email: string) => Promise<void>;
  createVaultPin: (email: string, pin: string, remember: boolean, enableBiometric: boolean) => Promise<void>;
  unlockWithPin: (email: string, pin: string, remember: boolean, enableBiometric: boolean) => Promise<void>;
  unlockWithBiometrics: (email: string) => Promise<boolean>;
  getActiveKeyForUser: (email: string) => string | null;
  resetVaultForUser: (email: string) => Promise<void>;
  clearVaultSession: () => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VaultState>('idle');
  const [rememberPin, setRememberPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const bootstrapForUser = useCallback(async (email: string) => {
    setState('loading');

    const result = await bootstrapVault(email);
    const profile = result.profile;
    const remembered = Boolean(profile?.rememberPin);
    const biometricAllowed = Boolean(profile?.biometricEnabled) && remembered;

    setRememberPin(remembered);
    setBiometricEnabled(biometricAllowed);
    setBiometricAvailable(result.biometricAvailable);

    if (profile?.hasVault && !profile.keyFingerprint && result.persistedKeyBase64) {
      const fingerprint = await buildVaultKeyFingerprint(result.persistedKeyBase64, email);
      await saveVaultProfile(email, {
        hasVault: true,
        rememberPin: remembered,
        biometricEnabled: biometricAllowed,
        keyFingerprint: fingerprint,
      });
    }

    if (!profile?.hasVault) {
      clearActiveVaultKey();
      setState('needs-pin-creation');
      return;
    }

    if (hasActiveVaultKey(email)) {
      setState('unlocked');
      return;
    }

    if (biometricAllowed && result.biometricAvailable) {
      setState('needs-pin-entry');
      return;
    }

    if (remembered && result.persistedKeyBase64) {
      setActiveVaultKey(email, result.persistedKeyBase64);
      setState('unlocked');
      return;
    }

    setState('needs-pin-entry');
  }, []);

  const persistConfig = useCallback(
    async (email: string, rawKeyBase64: string, remember: boolean, enableBiometric: boolean) => {
      const keyFingerprint = await buildVaultKeyFingerprint(rawKeyBase64, email);

      if (remember) {
        await savePersistedVaultKey(email, rawKeyBase64);
      } else {
        await clearPersistedVaultKey(email);
      }

      await saveVaultProfile(email, {
        hasVault: true,
        rememberPin: remember,
        biometricEnabled: remember && enableBiometric,
        keyFingerprint,
      });

      setRememberPin(remember);
      setBiometricEnabled(remember && enableBiometric);
    },
    [],
  );

  const createVaultPin = useCallback(
    async (email: string, pin: string, remember: boolean, enableBiometric: boolean) => {
      const rawKeyBase64 = await deriveVaultKeyFromPin(pin, email);
      setActiveVaultKey(email, rawKeyBase64);
      await persistConfig(email, rawKeyBase64, remember, enableBiometric);
      setState('unlocked');
    },
    [persistConfig],
  );

  const unlockWithPin = useCallback(
    async (email: string, pin: string, remember: boolean, enableBiometric: boolean) => {
      const rawKeyBase64 = await deriveVaultKeyFromPin(pin, email);
      const profile = await loadVaultProfile(email);

      if (profile?.hasVault && profile.keyFingerprint) {
        const derivedFingerprint = await buildVaultKeyFingerprint(rawKeyBase64, email);
        if (derivedFingerprint !== profile.keyFingerprint) {
          throw new Error('PIN invalido para este cofre.');
        }
      }

      setActiveVaultKey(email, rawKeyBase64);
      await persistConfig(email, rawKeyBase64, remember, enableBiometric);
      setState('unlocked');
    },
    [persistConfig],
  );

  const unlockWithBiometrics = useCallback(async (email: string): Promise<boolean> => {
    const profile = await loadVaultProfile(email);
    if (!profile?.rememberPin || !profile.biometricEnabled) {
      return false;
    }

    const authOk = await authenticateWithBiometrics();
    if (!authOk) {
      return false;
    }

    const persistedKey = await bootstrapVault(email);
    if (!persistedKey.persistedKeyBase64) {
      return false;
    }

    setActiveVaultKey(email, persistedKey.persistedKeyBase64);
    setRememberPin(true);
    setBiometricEnabled(true);
    setBiometricAvailable(persistedKey.biometricAvailable);
    setState('unlocked');
    return true;
  }, []);

  const getActiveKeyForUser = useCallback((email: string): string | null => {
    return getActiveVaultKeyBase64(email);
  }, []);

  const resetVaultForUser = useCallback(async (email: string) => {
    await clearPersistedVaultKey(email);
    await saveVaultProfile(email, {
      hasVault: false,
      rememberPin: false,
      biometricEnabled: false,
    });
    clearActiveVaultKey();
    setRememberPin(false);
    setBiometricEnabled(false);
    setState('needs-pin-creation');
  }, []);

  const clearVaultSession = useCallback(() => {
    clearActiveVaultKey();
    setState('idle');
  }, []);

  const value = useMemo<VaultContextValue>(
    () => ({
      state,
      isReady: state === 'unlocked',
      rememberPin,
      biometricEnabled,
      biometricAvailable,
      bootstrapForUser,
      createVaultPin,
      unlockWithPin,
      unlockWithBiometrics,
      getActiveKeyForUser,
      resetVaultForUser,
      clearVaultSession,
    }),
    [
      biometricAvailable,
      biometricEnabled,
      bootstrapForUser,
      clearVaultSession,
      createVaultPin,
      getActiveKeyForUser,
      rememberPin,
      resetVaultForUser,
      state,
      unlockWithBiometrics,
      unlockWithPin,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used inside VaultProvider');
  }
  return context;
}
