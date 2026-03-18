import * as ExpoCrypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_SIZE_BYTES = 32;
const IV_SIZE_BYTES = 12;
const PBKDF2_ITERATIONS = 210_000;
const PROFILE_VERSION = 1;

const isWeb = Platform.OS === 'web';

type StoredVaultProfile = {
  version: number;
  hasVault: boolean;
  rememberPin: boolean;
  biometricEnabled: boolean;
  keyFingerprint?: string;
};

type StoredVaultKey = {
  version: number;
  keyBase64: string;
};

export type VaultBootstrapResult = {
  profile: StoredVaultProfile | null;
  persistedKeyBase64: string | null;
  biometricAvailable: boolean;
};

export type BiometricCapability = {
  available: boolean;
  hardware: boolean;
  enrolled: boolean;
};

let activeVaultOwner: string | null = null;
let activeVaultKeyBase64: string | null = null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function profileStorageKey(email: string): string {
  return `truew8.vault.profile.${encodeURIComponent(normalizeEmail(email))}`;
}

function keyStorageKey(email: string): string {
  return `truew8.vault.key.${encodeURIComponent(normalizeEmail(email))}`;
}

function requirePinFormat(pin: string): void {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('PIN inválido. Use 6 dígitos numéricos.');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  throw new Error('Base64 encoder indisponivel neste ambiente.');
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof globalThis.atob !== 'function') {
    throw new Error('Base64 decoder indisponivel neste ambiente.');
  }

  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getRandomBytes(length: number): Uint8Array {
  const random = ExpoCrypto.getRandomBytes(length);
  return random instanceof Uint8Array ? random : new Uint8Array(random);
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function getSubtleCrypto(): Promise<SubtleCrypto> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto não disponível neste dispositivo.');
  }
  return subtle;
}

async function deterministicSaltFromEmail(email: string): Promise<Uint8Array> {
  const digestHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    `truew8-vault-salt::${normalizeEmail(email)}::v1`,
    { encoding: ExpoCrypto.CryptoEncoding.HEX },
  );

  const bytes = new Uint8Array(digestHex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const start = i * 2;
    bytes[i] = Number.parseInt(digestHex.slice(start, start + 2), 16);
  }

  return bytes.slice(0, 16);
}

async function deriveRawKey(pin: string, email: string): Promise<Uint8Array> {
  requirePinFormat(pin);
  const subtle = await getSubtleCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const salt = await deterministicSaltFromEmail(email);

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: toArrayBuffer(salt),
    },
    keyMaterial,
    KEY_SIZE_BYTES * 8,
  );

  return new Uint8Array(derivedBits);
}

async function importVaultKey(rawKeyBase64: string): Promise<CryptoKey> {
  const subtle = await getSubtleCrypto();
  return subtle.importKey('raw', toArrayBuffer(base64ToBytes(rawKeyBase64)), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function persistRawString(storageKey: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(storageKey, value);
    return;
  }

  await SecureStore.setItemAsync(storageKey, value);
}

function secureStoreDeviceAuthOptions(): SecureStore.SecureStoreOptions {
  return {
    requireAuthentication: true,
    authenticationPrompt: 'Autentique para acessar a chave criptografica do cofre',
  };
}

async function persistProtectedSecret(storageKey: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(storageKey, value);
    return;
  }

  const canRequireDeviceAuth = SecureStore.canUseBiometricAuthentication();
  if (canRequireDeviceAuth) {
    try {
      await SecureStore.setItemAsync(storageKey, value, secureStoreDeviceAuthOptions());
      return;
    } catch {
      // Fall back to normal secure storage when auth-gated keychain is not usable on device/runtime.
    }
  }

  await SecureStore.setItemAsync(storageKey, value);
}

async function readProtectedSecret(storageKey: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(storageKey) ?? null;
  }

  const canRequireDeviceAuth = SecureStore.canUseBiometricAuthentication();
  if (canRequireDeviceAuth) {
    try {
      return await SecureStore.getItemAsync(storageKey, secureStoreDeviceAuthOptions());
    } catch {
      // Ignore and try plain read for backward compatibility with previously stored non-auth entries.
    }
  }

  return SecureStore.getItemAsync(storageKey);
}

async function deleteProtectedSecret(storageKey: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(storageKey);
    return;
  }

  const canRequireDeviceAuth = SecureStore.canUseBiometricAuthentication();
  if (canRequireDeviceAuth) {
    try {
      await SecureStore.deleteItemAsync(storageKey, secureStoreDeviceAuthOptions());
      return;
    } catch {
      // Fall back to plain delete when protected delete fails.
    }
  }

  await SecureStore.deleteItemAsync(storageKey);
}

async function readRawString(storageKey: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(storageKey) ?? null;
  }

  return SecureStore.getItemAsync(storageKey);
}

async function deleteRawString(storageKey: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(storageKey);
    return;
  }

  await SecureStore.deleteItemAsync(storageKey);
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (isWeb) {
    return { available: false, hardware: false, enrolled: false };
  }

  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hardware ? await LocalAuthentication.isEnrolledAsync() : false;

  return {
    hardware,
    enrolled,
    available: hardware && enrolled,
  };
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const capability = await getBiometricCapability();
  if (!capability.available) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear cofre TrueW8',
    cancelLabel: 'Usar PIN',
    fallbackLabel: 'Usar PIN',
    disableDeviceFallback: false,
  });

  return result.success;
}

export function setActiveVaultKey(email: string, rawKeyBase64: string): void {
  activeVaultOwner = normalizeEmail(email);
  activeVaultKeyBase64 = rawKeyBase64;
}

export function clearActiveVaultKey(): void {
  activeVaultOwner = null;
  activeVaultKeyBase64 = null;
}

export function hasActiveVaultKey(email: string): boolean {
  return Boolean(activeVaultKeyBase64 && activeVaultOwner === normalizeEmail(email));
}

export function getActiveVaultKeyBase64(email: string): string | null {
  if (activeVaultOwner !== normalizeEmail(email)) {
    return null;
  }
  return activeVaultKeyBase64;
}

export async function deriveVaultKeyFromPin(pin: string, email: string): Promise<string> {
  const rawKey = await deriveRawKey(pin, email);
  return bytesToBase64(rawKey);
}

export async function buildVaultKeyFingerprint(rawKeyBase64: string, email: string): Promise<string> {
  return ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    `truew8-vault-fingerprint::${normalizeEmail(email)}::${rawKeyBase64}`,
    { encoding: ExpoCrypto.CryptoEncoding.HEX },
  );
}

export async function encryptVaultValue(plaintext: string, rawKeyBase64: string): Promise<string> {
  const subtle = await getSubtleCrypto();
  const iv = getRandomBytes(IV_SIZE_BYTES);
  const key = await importVaultKey(rawKeyBase64);

  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    new TextEncoder().encode(plaintext),
  );

  const cipherBytes = new Uint8Array(encryptedBuffer);
  return `v1:${bytesToBase64(iv)}:${bytesToBase64(cipherBytes)}`;
}

export async function decryptVaultValue(
  ciphertext: string,
  rawKeyBase64: string,
  options: { allowLegacyPlaintext?: boolean } = {},
): Promise<string> {
  if (!ciphertext.startsWith('v1:')) {
    if (options.allowLegacyPlaintext) {
      return ciphertext;
    }
    throw new Error('Campo sensivel recebido sem criptografia E2EE.');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de ciphertext invalido.');
  }

  const [, ivBase64, dataBase64] = parts;
  const subtle = await getSubtleCrypto();
  const key = await importVaultKey(rawKeyBase64);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(base64ToBytes(ivBase64)),
    },
    key,
    toArrayBuffer(base64ToBytes(dataBase64)),
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export async function saveVaultProfile(email: string, profile: Omit<StoredVaultProfile, 'version'>): Promise<void> {
  const payload: StoredVaultProfile = {
    version: PROFILE_VERSION,
    ...profile,
  };

  await persistRawString(profileStorageKey(email), JSON.stringify(payload));
}

export async function loadVaultProfile(email: string): Promise<StoredVaultProfile | null> {
  const raw = await readRawString(profileStorageKey(email));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredVaultProfile;
    if (typeof parsed.hasVault === 'boolean' && typeof parsed.rememberPin === 'boolean' && typeof parsed.biometricEnabled === 'boolean') {
      return {
        version: PROFILE_VERSION,
        hasVault: parsed.hasVault,
        rememberPin: parsed.rememberPin,
        biometricEnabled: parsed.biometricEnabled,
        keyFingerprint: typeof parsed.keyFingerprint === 'string' ? parsed.keyFingerprint : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function savePersistedVaultKey(email: string, rawKeyBase64: string): Promise<void> {
  const payload: StoredVaultKey = {
    version: PROFILE_VERSION,
    keyBase64: rawKeyBase64,
  };
  await persistProtectedSecret(keyStorageKey(email), JSON.stringify(payload));
}

export async function loadPersistedVaultKey(email: string): Promise<string | null> {
  const raw = await readProtectedSecret(keyStorageKey(email));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredVaultKey;
    if (typeof parsed.keyBase64 === 'string' && parsed.keyBase64.length > 0) {
      return parsed.keyBase64;
    }
  } catch {
    return null;
  }

  return null;
}

export async function clearPersistedVaultKey(email: string): Promise<void> {
  await deleteProtectedSecret(keyStorageKey(email));
}

export async function bootstrapVault(email: string): Promise<VaultBootstrapResult> {
  const [profile, persistedKeyBase64, biometricCapability] = await Promise.all([
    loadVaultProfile(email),
    loadPersistedVaultKey(email),
    getBiometricCapability(),
  ]);

  return {
    profile,
    persistedKeyBase64,
    biometricAvailable: biometricCapability.available,
  };
}
