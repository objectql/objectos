/**
 * Tests for BulkActionBar component.
 *
 * Validates rendering and behavior of bulk action controls.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionBar } from '@/components/objectui/BulkActionBar';
import type { ObjectDefinition } from '@/types/metadata';

const mockObjectDef: ObjectDefinition = {
  name: 'lead',
  label: 'Lead',
  pluralLabel: 'Leads',
  fields: {
    id: { type: 'text', label: 'ID', readonly: true },
    name: { type: 'text', label: 'Name', required: true },
    status: {
      type: 'select',
      label: 'Status',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Active', value: 'active' },
      ],
    },
  },
};

describe('BulkActionBar', () => {
  it('renders nothing when no records are selected', () => {
    const { container } = render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={[]}
        onBulkDelete={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows selection count when records are selected', () => {
    render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={['id-1', 'id-2']}
        onBulkDelete={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );
    expect(screen.getByText('2 records selected')).toBeDefined();
  });

  it('shows delete button', () => {
    render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={['id-1']}
        onBulkDelete={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('shows deselect button', () => {
    render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={['id-1']}
        onBulkDelete={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Deselect')).toBeDefined();
  });

  it('calls onDeselectAll when deselect is clicked', () => {
    const onDeselectAll = vi.fn();
    render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={['id-1']}
        onBulkDelete={vi.fn()}
        onDeselectAll={onDeselectAll}
      />,
    );
    fireEvent.click(screen.getByText('Deselect'));
    expect(onDeselectAll).toHaveBeenCalled();
  });

  it('shows update field button when onBulkUpdate is provided', () => {
    render(
      <BulkActionBar
        objectDef={mockObjectDef}
        selectedIds={['id-1']}
        onBulkDelete={vi.fn()}
        onBulkUpdate={vi.fn()}
        onDeselectAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Update field')).toBeDefined();
  });
});
