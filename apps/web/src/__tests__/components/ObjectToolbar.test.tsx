/**
 * Tests for ObjectToolbar component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ObjectToolbar } from '@/components/objectui/ObjectToolbar';
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
    due_date: { type: 'datetime', label: 'Due Date' },
  },
};

describe('ObjectToolbar', () => {
  it('renders record count', () => {
    render(
      <MemoryRouter>
        <ObjectToolbar
          objectDef={taskObjectDef}
          total={42}
          viewMode="table"
          onViewChange={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('42 records')).toBeDefined();
  });

  it('renders new record button when createPath is provided', () => {
    render(
      <MemoryRouter>
        <ObjectToolbar
          objectDef={taskObjectDef}
          total={5}
          viewMode="table"
          onViewChange={vi.fn()}
          createPath="/apps/crm/task/new"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('New Task')).toBeDefined();
  });

  it('does not render new record button without createPath', () => {
    render(
      <MemoryRouter>
        <ObjectToolbar
          objectDef={taskObjectDef}
          total={5}
          viewMode="table"
          onViewChange={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText('New Task')).toBeNull();
  });

  it('shows selection count when items are selected', () => {
    render(
      <MemoryRouter>
        <ObjectToolbar
          objectDef={taskObjectDef}
          total={10}
          viewMode="table"
          onViewChange={vi.fn()}
          selectedIds={['1', '2', '3']}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('3 selected')).toBeDefined();
  });
});
