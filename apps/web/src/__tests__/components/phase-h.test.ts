/**
 * Tests for Phase H bridge components and new features.
 */
import { describe, it, expect } from 'vitest';
import { ObjectToolbar } from '@/components/objectui/ObjectToolbar';
import { FilterPanel } from '@/components/objectui/FilterPanel';
import { QueryErrorBoundary } from '@/components/ui/query-error-boundary';

describe('Phase H component exports', () => {
  it('exports ObjectToolbar', () => {
    expect(ObjectToolbar).toBeTypeOf('function');
  });

  it('exports FilterPanel', () => {
    expect(FilterPanel).toBeTypeOf('function');
  });

  it('exports QueryErrorBoundary', () => {
    expect(QueryErrorBoundary).toBeTypeOf('function');
  });
});
