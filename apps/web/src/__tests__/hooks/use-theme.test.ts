/**
 * Tests for use-theme hook.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '@/hooks/use-theme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('exports useTheme as a function', () => {
    expect(useTheme).toBeTypeOf('function');
  });
});
