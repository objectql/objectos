/**
 * Tests for InlineEditCell component.
 *
 * Validates rendering in display and edit modes.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineEditCell } from '@/components/objectui/InlineEditCell';
import type { FieldDefinition } from '@/types/metadata';

const textField: FieldDefinition = {
  name: 'company',
  type: 'text',
  label: 'Company',
};

const selectField: FieldDefinition = {
  name: 'status',
  type: 'select',
  label: 'Status',
  options: [
    { label: 'New', value: 'new' },
    { label: 'Active', value: 'active' },
  ],
};

const readonlyField: FieldDefinition = {
  name: 'id',
  type: 'text',
  label: 'ID',
  readonly: true,
};

describe('InlineEditCell', () => {
  it('renders field value in display mode', () => {
    render(<InlineEditCell field={textField} value="Acme Corp" onSave={vi.fn()} />);
    expect(screen.getByText('Acme Corp')).toBeDefined();
  });

  it('enters edit mode on click', () => {
    render(<InlineEditCell field={textField} value="Acme Corp" onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('inline-edit-cell'));
    expect(screen.getByTestId('inline-edit-active')).toBeDefined();
  });

  it('does not enter edit mode when editable is false', () => {
    render(
      <InlineEditCell field={textField} value="Acme Corp" onSave={vi.fn()} editable={false} />,
    );
    fireEvent.click(screen.getByText('Acme Corp'));
    expect(screen.queryByTestId('inline-edit-active')).toBeNull();
  });

  it('does not enter edit mode for readonly fields', () => {
    render(<InlineEditCell field={readonlyField} value="123" onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('123'));
    expect(screen.queryByTestId('inline-edit-active')).toBeNull();
  });

  it('calls onSave with new value', () => {
    const onSave = vi.fn();
    render(<InlineEditCell field={textField} value="Acme" onSave={onSave} />);
    fireEvent.click(screen.getByTestId('inline-edit-cell'));
    const input = screen.getByLabelText('Edit Company');
    fireEvent.change(input, { target: { value: 'New Corp' } });
    fireEvent.click(screen.getByLabelText('Save'));
    expect(onSave).toHaveBeenCalledWith('New Corp');
  });

  it('renders select dropdown for select fields', () => {
    render(<InlineEditCell field={selectField} value="new" onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('inline-edit-cell'));
    expect(screen.getByLabelText('Edit Status')).toBeDefined();
  });

  it('cancels editing on cancel button click', () => {
    render(<InlineEditCell field={textField} value="Acme" onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('inline-edit-cell'));
    fireEvent.click(screen.getByLabelText('Cancel'));
    expect(screen.queryByTestId('inline-edit-active')).toBeNull();
  });
});
