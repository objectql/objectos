import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowStatusBadge } from '@/components/workflow/WorkflowStatusBadge';
import type { WorkflowStatus } from '@/types/workflow';

function makeStatus(overrides?: Partial<WorkflowStatus>): WorkflowStatus {
  return {
    workflowName: 'test_flow',
    currentState: 'pending',
    currentStateLabel: 'Pending',
    color: 'yellow',
    availableTransitions: [],
    ...overrides,
  };
}

describe('WorkflowStatusBadge', () => {
  it('renders the current state label', () => {
    render(<WorkflowStatusBadge status={makeStatus()} />);
    expect(screen.getByText('Pending')).toBeDefined();
  });

  it('renders with green color for approved state', () => {
    render(
      <WorkflowStatusBadge
        status={makeStatus({ currentStateLabel: 'Approved', color: 'green' })}
      />,
    );
    expect(screen.getByText('Approved')).toBeDefined();
  });

  it('shows workflow name when showWorkflowName is true', () => {
    render(
      <WorkflowStatusBadge
        status={makeStatus({ workflowName: 'leave_flow' })}
        showWorkflowName
      />,
    );
    expect(screen.getByText('leave_flow:')).toBeDefined();
  });

  it('hides workflow name by default', () => {
    const { container } = render(
      <WorkflowStatusBadge status={makeStatus({ workflowName: 'leave_flow' })} />,
    );
    expect(container.textContent).not.toContain('leave_flow:');
  });

  it('has data-testid attribute', () => {
    render(<WorkflowStatusBadge status={makeStatus()} />);
    expect(screen.getByTestId('workflow-status-badge')).toBeDefined();
  });
});
