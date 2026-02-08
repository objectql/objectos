/**
 * Tests for i18n library functions.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveKey,
  interpolate,
  translate,
  createI18nState,
  loadTranslations,
} from '@/lib/i18n';

describe('resolveKey', () => {
  const map = {
    common: { save: 'Save', nested: { deep: 'Deep Value' } },
    top: 'Top Level',
  };

  it('resolves a top-level key', () => {
    expect(resolveKey(map, 'top')).toBe('Top Level');
  });

  it('resolves a nested key', () => {
    expect(resolveKey(map, 'common.save')).toBe('Save');
  });

  it('resolves a deeply nested key', () => {
    expect(resolveKey(map, 'common.nested.deep')).toBe('Deep Value');
  });

  it('returns undefined for missing key', () => {
    expect(resolveKey(map, 'missing.key')).toBeUndefined();
  });

  it('returns undefined for a non-leaf node', () => {
    expect(resolveKey(map, 'common')).toBeUndefined();
  });
});

describe('interpolate', () => {
  it('replaces {{variable}} placeholders', () => {
    expect(interpolate('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
  });

  it('handles multiple placeholders', () => {
    expect(interpolate('{{a}} + {{b}} = {{c}}', { a: '1', b: '2', c: '3' })).toBe('1 + 2 = 3');
  });

  it('leaves unknown placeholders intact', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });

  it('handles numeric values', () => {
    expect(interpolate('Count: {{count}}', { count: 42 })).toBe('Count: 42');
  });
});

describe('translate', () => {
  const translations = {
    en: { common: { save: 'Save' }, greeting: 'Hello {{name}}' },
    es: { common: { save: 'Guardar' } },
  };

  it('translates a key in the current locale', () => {
    expect(translate(translations, 'en', 'en', 'common.save')).toBe('Save');
  });

  it('translates a key in a non-default locale', () => {
    expect(translate(translations, 'es', 'en', 'common.save')).toBe('Guardar');
  });

  it('falls back to fallback locale', () => {
    expect(translate(translations, 'es', 'en', 'greeting', { name: 'World' })).toBe('Hello World');
  });

  it('returns the raw key when not found', () => {
    expect(translate(translations, 'en', 'en', 'missing.key')).toBe('missing.key');
  });

  it('interpolates values', () => {
    expect(translate(translations, 'en', 'en', 'greeting', { name: 'Alice' })).toBe('Hello Alice');
  });
});

describe('createI18nState', () => {
  it('creates state with default English locale', () => {
    const state = createI18nState();
    expect(state.locale).toBe('en');
    expect(state.fallbackLocale).toBe('en');
    expect(state.translations.en).toBeDefined();
  });

  it('creates state with custom locale', () => {
    const state = createI18nState('fr');
    expect(state.locale).toBe('fr');
  });

  it('includes default English translations', () => {
    const state = createI18nState();
    expect(resolveKey(state.translations.en, 'common.save')).toBe('Save');
    expect(resolveKey(state.translations.en, 'auth.signIn')).toBe('Sign In');
    expect(resolveKey(state.translations.en, 'sync.offline')).toBe('Offline');
    expect(resolveKey(state.translations.en, 'theme.dark')).toBe('Dark');
  });
});

describe('loadTranslations', () => {
  it('adds translations for a new locale', () => {
    const state = createI18nState();
    const updated = loadTranslations(state, 'es', { common: { save: 'Guardar' } });
    expect(resolveKey(updated.translations.es, 'common.save')).toBe('Guardar');
  });

  it('preserves existing translations', () => {
    const state = createI18nState();
    const updated = loadTranslations(state, 'en', { custom: { key: 'value' } });
    expect(resolveKey(updated.translations.en, 'common.save')).toBe('Save');
  });
});
