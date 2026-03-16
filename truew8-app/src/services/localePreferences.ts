import { apiClient } from '@/src/services/api';

export type LocalePreferenceResponse = {
  selectedLocale: string;
  effectiveLocale: string;
  availableLocales: string[];
};

export async function getLocalePreference(): Promise<LocalePreferenceResponse> {
  const { data } = await apiClient.get<LocalePreferenceResponse>('/preferences/locale');
  return data;
}

export async function updateLocalePreference(locale: string): Promise<LocalePreferenceResponse> {
  const { data } = await apiClient.put<LocalePreferenceResponse>('/preferences/locale', { locale });
  return data;
}
