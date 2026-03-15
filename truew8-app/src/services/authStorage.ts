import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'truew8.session';

const isWeb = Platform.OS === 'web';

export type StoredSession = {
  token: string;
  email: string;
};

export async function saveSession(session: StoredSession): Promise<void> {
  const serialized = JSON.stringify(session);
  if (isWeb) {
    globalThis.localStorage?.setItem(SESSION_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, serialized);
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = isWeb
    ? globalThis.localStorage?.getItem(SESSION_KEY) ?? null
    : await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (typeof parsed.token === 'string' && typeof parsed.email === 'string') {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function clearSession(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
