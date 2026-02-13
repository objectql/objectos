import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher, findKanbanField } from '@/components/objectui/ViewSwitcher';
import type { ObjectDefinition } from '@/types/metadata';
import { vi } from 'vitest';

const taskObjectDef: ObjectDefinition = {
  name: 'task',
  label: 'Task',
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

const noSelectObjectDef: ObjectDefinition = {
  name: 'note',
  label: 'Note',
  fields: {
    id: { type: 'text', label: 'ID', readonly: true },
    content: { type: 'textarea', label: 'Content' },
  },
};

describe('findKanbanField', () => {
  it('returns status field for object with select fields', () => {
    expect(findKanbanField(taskObjectDef)).toBe('status');
  });

  it('returns undefined for object without select fields', () => {
    expect(findKanbanField(noSelectObjectDef)).toBeUndefined();
  });

  it('prefers status/stage/state/priority names', () => {
    const objectDef: ObjectDefinition = {
      name: 'test',
      label: 'Test',
      fields: {
        category: {
          type: 'select',
          label: 'Category',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
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
      },
    };
    expect(findKanbanField(objectDef)).toBe('priority');
  });
});

describe('ViewSwitcher', () => {
  it('renders all three view buttons', () => {
    render(<ViewSwitcher currentView="table" onViewChange={() => {}} />);
    // Three buttons should exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('calls onViewChange when a button is clicked', () => {
    const onViewChange = vi.fn();
    render(
      <ViewSwitcher currentView="table" onViewChange={onViewChange} objectDef={taskObjectDef} />,
    );
    // Click the kanban button (second button)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Kanban
    expect(onViewChange).toHaveBeenCalledWith('kanban');
  });

  it('disables kanban when no select field available', () => {
    render(
      <ViewSwitcher currentView="table" onViewChange={() => {}} objectDef={noSelectObjectDef} />,
    );
    const buttons = screen.getAllByRole('button');
    // Kanban button should be disabled
    expect(buttons[1].hasAttribute('disabled')).toBe(true);
  });

  it('enables kanban when select field is available', () => {
    render(<ViewSwitcher currentView="table" onViewChange={() => {}} objectDef={taskObjectDef} />);
    const buttons = screen.getAllByRole('button');
    // Kanban button should NOT be disabled
    expect(buttons[1].hasAttribute('disabled')).toBe(false);
  });
});
