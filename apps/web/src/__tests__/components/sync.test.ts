/**
 * Tests for sync components.
 */
import { describe, it, expect } from 'vitest';
import { OfflineIndicator, ConflictResolutionDialog } from '@/components/sync';

describe('sync component exports', () => {
  it('exports OfflineIndicator', () => {
    expect(OfflineIndicator).toBeTypeOf('function');
  });

  it('exports ConflictResolutionDialog', () => {
    expect(ConflictResolutionDialog).toBeTypeOf('function');
  });
});
