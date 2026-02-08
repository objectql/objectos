/**
 * Tests for use-offline hook.
 */
import { describe, it, expect } from 'vitest';
import { useOfflineStatus } from '@/hooks/use-offline';

describe('useOfflineStatus', () => {
  it('exports useOfflineStatus as a function', () => {
    expect(useOfflineStatus).toBeTypeOf('function');
  });
});
