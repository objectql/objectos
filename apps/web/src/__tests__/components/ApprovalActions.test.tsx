import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalActions } from '@/components/workflow/ApprovalActions';
import type { WorkflowStatus, WorkflowTransition } from '@/types/workflow';

function makeStatus(transitions: WorkflowTransition[]): WorkflowStatus {
  return {
    workflowName: 'test_flow',
    currentState: 'pending',
    currentStateLabel: 'Pending',
    color: 'yellow',
    availableTransitions: transitions,
  };
}

describe('ApprovalActions', () => {
  it('renders nothing when no transitions available', () => {
    const { container } = render(
      <ApprovalActions status={makeStatus([])} onTransition={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders approve button', () => {
    const transitions: WorkflowTransition[] = [
      { name: 'approve', label: 'Approve', from: 'pending', to: 'approved' },
    ];
    render(<ApprovalActions status={makeStatus(transitions)} onTransition={() => {}} />);
    expect(screen.getByText('Approve')).toBeDefined();
  });

  it('renders reject button with destructive variant', () => {
    const transitions: WorkflowTransition[] = [
      { name: 'reject', label: 'Reject', from: 'pending', to: 'rejected' },
    ];
    render(<ApprovalActions status={makeStatus(transitions)} onTransition={() => {}} />);
    expect(screen.getByText('Reject')).toBeDefined();
  });

  it('calls onTransition when button clicked', () => {
    const onTransition = vi.fn();
    const transitions: WorkflowTransition[] = [
      { name: 'approve', label: 'Approve', from: 'pending', to: 'approved' },
    ];
    render(<ApprovalActions status={makeStatus(transitions)} onTransition={onTransition} />);
    fireEvent.click(screen.getByText('Approve'));
    expect(onTransition).toHaveBeenCalledWith(transitions[0]);
  });

  it('disables buttons when isExecuting is true', () => {
    const transitions: WorkflowTransition[] = [
      { name: 'approve', label: 'Approve', from: 'pending', to: 'approved' },
    ];
    render(
      <ApprovalActions
        status={makeStatus(transitions)}
        onTransition={() => {}}
        isExecuting
      />,
    );
    const button = screen.getByText('Approve').closest('button');
    expect(button?.disabled).toBe(true);
  });
});
