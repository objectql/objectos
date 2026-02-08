/**
 * Tests for UI components (Phase 6).
 */
import { describe, it, expect } from 'vitest';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SkipLink } from '@/components/ui/skip-link';

describe('Phase 6 UI component exports', () => {
  it('exports ThemeToggle', () => {
    expect(ThemeToggle).toBeTypeOf('function');
  });

  it('exports SkipLink', () => {
    expect(SkipLink).toBeTypeOf('function');
  });
});
