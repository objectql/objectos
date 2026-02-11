/**
 * Tests for Phase L components — Polish & Performance.
 *
 * Validates exports and basic behavior of all Phase L components and hooks.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';
import { usePrefetch } from '@/hooks/use-prefetch';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';
import { ErrorBoundaryPage } from '@/components/ui/error-boundary-page';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton, CardGridSkeleton, FormSkeleton, DetailSkeleton } from '@/components/ui/loading-skeleton';

describe('Phase L hook exports', () => {
  it('exports useDebounce (L.3)', () => {
    expect(useDebounce).toBeTypeOf('function');
  });

  it('exports usePrefetch (L.2)', () => {
    expect(usePrefetch).toBeTypeOf('function');
  });

  it('exports useVirtualScroll (L.1)', () => {
    expect(useVirtualScroll).toBeTypeOf('function');
  });
});

describe('Phase L component exports', () => {
  it('exports ErrorBoundaryPage (L.4)', () => {
    expect(ErrorBoundaryPage).toBeTypeOf('function');
  });

  it('exports EmptyState (L.5)', () => {
    expect(EmptyState).toBeTypeOf('function');
  });

  it('exports skeleton components (L.5)', () => {
    expect(TableSkeleton).toBeTypeOf('function');
    expect(CardGridSkeleton).toBeTypeOf('function');
    expect(FormSkeleton).toBeTypeOf('function');
    expect(DetailSkeleton).toBeTypeOf('function');
  });
});

describe('EmptyState component', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Create your first item to get started." />);
    expect(screen.getByText('No items')).toBeDefined();
    expect(screen.getByText('Create your first item to get started.')).toBeDefined();
  });

  it('renders action button when provided', () => {
    render(<EmptyState title="No items" actionLabel="Create" onAction={() => {}} />);
    expect(screen.getByText('Create')).toBeDefined();
  });
});

describe('Loading skeleton components', () => {
  it('renders TableSkeleton', () => {
    render(<TableSkeleton rows={3} columns={2} />);
    expect(screen.getByTestId('table-skeleton')).toBeDefined();
  });

  it('renders CardGridSkeleton', () => {
    render(<CardGridSkeleton count={3} />);
    expect(screen.getByTestId('card-grid-skeleton')).toBeDefined();
  });

  it('renders FormSkeleton', () => {
    render(<FormSkeleton fields={3} />);
    expect(screen.getByTestId('form-skeleton')).toBeDefined();
  });

  it('renders DetailSkeleton', () => {
    render(<DetailSkeleton />);
    expect(screen.getByTestId('detail-skeleton')).toBeDefined();
  });
});
