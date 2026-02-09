/**
 * useI18n — translation hook.
 *
 * Provides a `t()` function for translating keys with optional
 * interpolation. Uses React Context for locale state.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  createI18nState,
  translate,
  loadTranslations,
  type I18nState,
  type Locale,
  type TranslationMap,
} from '@/lib/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  addTranslations: (locale: Locale, translations: TranslationMap) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale: initialLocale = 'en', children }: I18nProviderProps) {
  const [state, setState] = useState<I18nState>(() => createI18nState(initialLocale));

  const setLocale = useCallback((locale: Locale) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const addTranslations = useCallback((locale: Locale, translations: TranslationMap) => {
    setState((prev) => loadTranslations(prev, locale, translations));
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      translate(state.translations, state.locale, state.fallbackLocale, key, values),
    [state],
  );

  const value = useMemo(
    () => ({ locale: state.locale, setLocale, t, addTranslations }),
    [state.locale, setLocale, t, addTranslations],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
