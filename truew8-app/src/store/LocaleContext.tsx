import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { detectBestLocale, resolveLocale, SUPPORTED_LOCALES, SupportedLocale, translate, TranslationKey, TranslationParams } from '@/src/i18n';
import { setLocaleGetter } from '@/src/services/api';
import { getLocalePreference, updateLocalePreference } from '@/src/services/localePreferences';
import { useAuth } from '@/src/store/AuthContext';

type LocaleContextValue = {
  locale: SupportedLocale;
  availableLocales: SupportedLocale[];
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const LOCALE_STORAGE_KEY = 'truew8.locale';

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function getBrowserLocale(): string | null {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return Intl.DateTimeFormat().resolvedOptions().locale ?? null;
}

function getTimeZone(): string | null {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
}

function mapAvailableLocales(input: string[] | undefined): SupportedLocale[] {
  if (!input || input.length === 0) {
    return SUPPORTED_LOCALES;
  }

  const normalized = input
    .map((value) => resolveLocale(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  return normalized.length > 0 ? normalized : SUPPORTED_LOCALES;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [locale, setLocaleState] = useState<SupportedLocale>('pt-BR');
  const [availableLocales, setAvailableLocales] = useState<SupportedLocale[]>(SUPPORTED_LOCALES);

  useEffect(() => {
    setLocaleGetter(() => locale);
  }, [locale]);

  useEffect(() => {
    const bootstrap = async () => {
      const browserLocale = getBrowserLocale();
      const timeZone = getTimeZone();
      const detectedLocale = detectBestLocale({ browserLocale, timezone: timeZone });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored) {
          setLocaleState(resolveLocale(stored));
          return;
        }
      }

      setLocaleState(detectedLocale);
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const syncWithBackend = async () => {
      try {
        const preference = await getLocalePreference();
        const resolvedLocale = resolveLocale(preference.selectedLocale || preference.effectiveLocale);
        setLocaleState(resolvedLocale);
        setAvailableLocales(mapAvailableLocales(preference.availableLocales));
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, resolvedLocale);
        }
      } catch {
        // Keep local detection fallback when preference endpoint is unavailable.
      }
    };

    void syncWithBackend();
  }, [isAuthenticated, isLoading]);

  const setLocale = useCallback(
    async (nextLocale: SupportedLocale) => {
      const normalized = resolveLocale(nextLocale);
      setLocaleState(normalized);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
      }

      if (!isAuthenticated) {
        return;
      }

      try {
        const preference = await updateLocalePreference(normalized);
        setLocaleState(resolveLocale(preference.selectedLocale || preference.effectiveLocale));
        setAvailableLocales(mapAvailableLocales(preference.availableLocales));
      } catch {
        // Keep local value even if remote persistence fails.
      }
    },
    [isAuthenticated],
  );

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number) => {
      const currency = locale === 'en-US' ? 'USD' : 'BRL';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value);
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      availableLocales,
      setLocale,
      t,
      formatCurrency,
      formatNumber,
    }),
    [availableLocales, formatCurrency, formatNumber, locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return context;
}
