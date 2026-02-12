/**
 * Tests for Phase I hooks — Rich Data Experience.
 *
 * Validates exports and types of all Phase I hooks.
 */
import { describe, it, expect } from 'vitest';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useBulkActions } from '@/hooks/use-bulk-actions';
import { useSavedViews } from '@/hooks/use-saved-views';
import { useLookupSearch } from '@/hooks/use-lookup-search';
import { useCsvOperations } from '@/hooks/use-csv-operations';

describe('Phase I hook exports', () => {
  it('exports useInlineEdit hook (I.1)', () => {
    expect(useInlineEdit).toBeTypeOf('function');
  });

  it('exports useBulkActions hook (I.2)', () => {
    expect(useBulkActions).toBeTypeOf('function');
  });

  it('exports useSavedViews hook (I.3)', () => {
    expect(useSavedViews).toBeTypeOf('function');
  });

  it('exports useLookupSearch hook (I.7)', () => {
    expect(useLookupSearch).toBeTypeOf('function');
  });

  it('exports useCsvOperations hook (I.6)', () => {
    expect(useCsvOperations).toBeTypeOf('function');
  });
});
