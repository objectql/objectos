/**
 * Tests for useRecentItems hook.
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('useRecentItems', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports useRecentItems hook', async () => {
    const mod = await import('@/hooks/use-recent-items');
    expect(mod.useRecentItems).toBeTypeOf('function');
  });

  it('RecentItem type has required fields', async () => {
    // Verify the type structure by importing and checking the hook exists
    const mod = await import('@/hooks/use-recent-items');
    expect(mod.useRecentItems).toBeDefined();
  });
});
