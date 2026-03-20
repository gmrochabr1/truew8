import { apiClient } from "@/src/services/api";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type UserCustomizationPreference = {
  baseCurrency: "BRL" | "USD";
  toleranceValue: number;
  allowSells: boolean;
  theme: "LIGHT" | "DARK";
  availableBaseCurrencies: Array<"BRL" | "USD">;
  availableThemes: Array<"LIGHT" | "DARK">;
};

export type AssetLockConfirmationPreference = {
  keepConfirmationForIndividualAssets: boolean;
  hasConfirmedIndividualAssetLock: boolean;
};

const ASSET_LOCK_CONFIRMATION_PREFIX = "truew8.pref.asset-lock-confirmation";

const isWeb = Platform.OS === "web";

const defaultAssetLockPreference: AssetLockConfirmationPreference = {
  keepConfirmationForIndividualAssets: false,
  hasConfirmedIndividualAssetLock: false,
};

function getAssetLockPreferenceKey(email: string | null): string {
  const normalized = String(email ?? "")
    .trim()
    .toLowerCase();
  return `${ASSET_LOCK_CONFIRMATION_PREFIX}.${encodeURIComponent(normalized || "anonymous")}`;
}

async function saveLocalPreference(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function loadLocalPreference(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function getCustomizationPreferences(): Promise<UserCustomizationPreference> {
  const { data } = await apiClient.get<UserCustomizationPreference>("/preferences/customization");
  return data;
}

export async function updateCustomizationPreferences(
  payload: Pick<UserCustomizationPreference, "baseCurrency" | "toleranceValue" | "allowSells" | "theme">,
): Promise<UserCustomizationPreference> {
  const { data } = await apiClient.put<UserCustomizationPreference>("/preferences/customization", payload);
  return data;
}

export async function getAssetLockConfirmationPreference(
  email: string | null,
): Promise<AssetLockConfirmationPreference> {
  const raw = await loadLocalPreference(getAssetLockPreferenceKey(email));
  if (!raw) {
    return defaultAssetLockPreference;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AssetLockConfirmationPreference>;
    return {
      keepConfirmationForIndividualAssets:
        parsed.keepConfirmationForIndividualAssets === true,
      hasConfirmedIndividualAssetLock: parsed.hasConfirmedIndividualAssetLock === true,
    };
  } catch {
    return defaultAssetLockPreference;
  }
}

export async function saveAssetLockConfirmationPreference(
  email: string | null,
  preference: AssetLockConfirmationPreference,
): Promise<AssetLockConfirmationPreference> {
  const normalized: AssetLockConfirmationPreference = {
    keepConfirmationForIndividualAssets: preference.keepConfirmationForIndividualAssets === true,
    hasConfirmedIndividualAssetLock: preference.hasConfirmedIndividualAssetLock === true,
  };

  await saveLocalPreference(getAssetLockPreferenceKey(email), JSON.stringify(normalized));
  return normalized;
}

export async function updateAssetLockConfirmationPreference(
  email: string | null,
  patch: Partial<AssetLockConfirmationPreference>,
): Promise<AssetLockConfirmationPreference> {
  const current = await getAssetLockConfirmationPreference(email);
  const next: AssetLockConfirmationPreference = {
    ...current,
    ...patch,
  };
  return saveAssetLockConfirmationPreference(email, next);
}
