/**
 * i18n integration for the frontend.
 *
 * Provides a lightweight i18n context for the React app, compatible
 * with the @objectos/i18n package conventions. Supports nested key
 * lookup, interpolation, and locale switching.
 */

export type Locale = string;

export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

export interface I18nState {
  locale: Locale;
  fallbackLocale: Locale;
  translations: Record<Locale, TranslationMap>;
}

// ── Default translations (English) ──────────────────────────────

const defaultTranslations: TranslationMap = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading…',
    error: 'An error occurred',
    retry: 'Retry',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    yes: 'Yes',
    no: 'No',
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    email: 'Email',
    password: 'Password',
  },
  sync: {
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing…',
    syncError: 'Sync error',
    pendingChanges: '{{count}} pending change(s)',
    conflictsDetected: '{{count}} conflict(s) detected',
    lastSynced: 'Last synced: {{time}}',
    resolveConflict: 'Resolve Conflict',
    keepLocal: 'Keep Local',
    keepServer: 'Keep Server',
    mergeManually: 'Merge Manually',
  },
  nav: {
    home: 'Home',
    settings: 'Settings',
    apps: 'Apps',
    skipToContent: 'Skip to main content',
  },
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
};

/**
 * Resolve a dotted key path (e.g. "common.save") from a nested translation map.
 */
export function resolveKey(translations: TranslationMap, key: string): string | undefined {
  const parts = key.split('.');
  let current: TranslationMap | string = translations;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = current[part] as TranslationMap | string;
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Simple interpolation: replace {{variable}} placeholders.
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key] !== undefined ? String(values[key]) : `{{${key}}}`,
  );
}

/**
 * Translate a key with optional interpolation values.
 */
export function translate(
  translations: Record<Locale, TranslationMap>,
  locale: Locale,
  fallbackLocale: Locale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const result =
    resolveKey(translations[locale] ?? {}, key) ??
    resolveKey(translations[fallbackLocale] ?? {}, key) ??
    key;

  return values ? interpolate(result, values) : result;
}

/**
 * Create an initial i18n state with English defaults.
 */
export function createI18nState(locale: Locale = 'en'): I18nState {
  return {
    locale,
    fallbackLocale: 'en',
    translations: { en: defaultTranslations },
  };
}

/**
 * Load translations for a locale into the state.
 */
export function loadTranslations(
  state: I18nState,
  locale: Locale,
  translations: TranslationMap,
): I18nState {
  return {
    ...state,
    translations: {
      ...state.translations,
      [locale]: {
        ...state.translations[locale],
        ...translations,
      },
    },
  };
}
