/**
 * Tests for FlowEditor component.
 *
 * Validates rendering and basic interaction of the visual flow editor.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowEditor } from '@/components/workflow/FlowEditor';
import type { WorkflowDefinition } from '@/types/workflow';

const mockWorkflow: WorkflowDefinition = {
  name: 'test_flow',
  label: 'Test Flow',
  object: 'leave_request',
  stateField: 'status',
  states: [
    { name: 'draft', label: 'Draft', initial: true, color: 'default' },
    { name: 'pending', label: 'Pending', color: 'yellow' },
    { name: 'approved', label: 'Approved', final: true, color: 'green' },
  ],
  transitions: [
    { name: 'submit', label: 'Submit', from: 'draft', to: 'pending' },
    { name: 'approve', label: 'Approve', from: 'pending', to: 'approved' },
  ],
};

describe('FlowEditor', () => {
  it('renders the workflow title', () => {
    render(<FlowEditor workflow={mockWorkflow} />);
    expect(screen.getByText('Test Flow')).toBeDefined();
  });

  it('renders all states', () => {
    render(<FlowEditor workflow={mockWorkflow} />);
    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByText('Pending')).toBeDefined();
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('renders all transitions', () => {
    render(<FlowEditor workflow={mockWorkflow} />);
    expect(screen.getByText('Submit')).toBeDefined();
    expect(screen.getByText('Approve')).toBeDefined();
  });

  it('shows Add State button when not read-only', () => {
    render(<FlowEditor workflow={mockWorkflow} />);
    expect(screen.getByText('Add State')).toBeDefined();
  });

  it('hides Add State button in read-only mode', () => {
    render(<FlowEditor workflow={mockWorkflow} readOnly />);
    expect(screen.queryByText('Add State')).toBeNull();
  });

  it('shows Save button when onSave is provided', () => {
    render(<FlowEditor workflow={mockWorkflow} onSave={vi.fn()} />);
    expect(screen.getByText('Save')).toBeDefined();
  });

  it('shows state and transition counts', () => {
    render(<FlowEditor workflow={mockWorkflow} />);
    expect(screen.getByText(/3 states/)).toBeDefined();
    expect(screen.getByText(/2 transitions/)).toBeDefined();
  });
});
