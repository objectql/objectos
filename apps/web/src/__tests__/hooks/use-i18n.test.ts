/**
 * Tests for use-i18n hook.
 */
import { describe, it, expect } from 'vitest';
import { I18nProvider, useI18n } from '@/hooks/use-i18n';

describe('use-i18n exports', () => {
  it('exports I18nProvider as a function', () => {
    expect(I18nProvider).toBeTypeOf('function');
  });

  it('exports useI18n as a function', () => {
    expect(useI18n).toBeTypeOf('function');
  });
});
