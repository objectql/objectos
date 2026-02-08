/**
 * Tests for use-records hooks.
 *
 * Validates the exports and types of all record hooks, including
 * the newly added mutation hooks (useCreateRecord, useUpdateRecord, useDeleteRecord).
 */
import { describe, it, expect } from 'vitest';
import {
  useRecords,
  useRecord,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
} from '@/hooks/use-records';

describe('use-records exports', () => {
  it('exports useRecords hook', () => {
    expect(useRecords).toBeTypeOf('function');
  });

  it('exports useRecord hook', () => {
    expect(useRecord).toBeTypeOf('function');
  });

  it('exports useCreateRecord hook', () => {
    expect(useCreateRecord).toBeTypeOf('function');
  });

  it('exports useUpdateRecord hook', () => {
    expect(useUpdateRecord).toBeTypeOf('function');
  });

  it('exports useDeleteRecord hook', () => {
    expect(useDeleteRecord).toBeTypeOf('function');
  });
});
