/**
 * Tests for use-sync hook.
 */
import { describe, it, expect } from 'vitest';
import { useSyncEngine } from '@/hooks/use-sync';

describe('useSyncEngine', () => {
  it('exports useSyncEngine as a function', () => {
    expect(useSyncEngine).toBeTypeOf('function');
  });
});
