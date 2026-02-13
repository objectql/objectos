/**
 * Tests for FilterPanel component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '@/components/objectui/FilterPanel';
import type { ObjectDefinition } from '@/types/metadata';

const taskObjectDef: ObjectDefinition = {
  name: 'task',
  label: 'Task',
  pluralLabel: 'Tasks',
  fields: {
    id: { type: 'text', label: 'ID', readonly: true },
    title: { type: 'text', label: 'Title' },
    status: {
      type: 'select',
      label: 'Status',
      options: [
        { label: 'To Do', value: 'todo' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Done', value: 'done' },
      ],
    },
    priority: {
      type: 'select',
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'High', value: 'high' },
      ],
    },
    due_date: { type: 'datetime', label: 'Due Date' },
    created_at: { type: 'datetime', label: 'Created', readonly: true },
  },
};

describe('FilterPanel', () => {
  it('renders search input', () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterPanel
        objectDef={taskObjectDef}
        filters={[]}
        onFiltersChange={onFiltersChange}
        searchTerm=""
        onSearchChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Search records')).toBeDefined();
  });

  it('renders filter button', () => {
    render(<FilterPanel objectDef={taskObjectDef} filters={[]} onFiltersChange={vi.fn()} />);
    expect(screen.getByText('Filters')).toBeDefined();
  });

  it('shows active filter count', () => {
    render(
      <FilterPanel
        objectDef={taskObjectDef}
        filters={[{ field: 'status', operator: 'equals', value: 'todo' }]}
        onFiltersChange={vi.fn()}
      />,
    );
    expect(screen.getByText('1')).toBeDefined();
  });

  it('displays active filter badges', () => {
    render(
      <FilterPanel
        objectDef={taskObjectDef}
        filters={[{ field: 'status', operator: 'equals', value: 'todo' }]}
        onFiltersChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Status:')).toBeDefined();
    expect(screen.getByText('todo')).toBeDefined();
  });

  it('shows filter builder when expanded', () => {
    render(<FilterPanel objectDef={taskObjectDef} filters={[]} onFiltersChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByLabelText('Filter field')).toBeDefined();
  });

  it('calls onSearchChange when search input changes', () => {
    const onSearchChange = vi.fn();
    render(
      <FilterPanel
        objectDef={taskObjectDef}
        filters={[]}
        onFiltersChange={vi.fn()}
        searchTerm=""
        onSearchChange={onSearchChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Search records'), {
      target: { value: 'test' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });
});
