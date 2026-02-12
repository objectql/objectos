/**
 * Tests for ApprovalInbox component.
 *
 * Validates rendering and filtering behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApprovalInbox } from '@/components/workflow/ApprovalInbox';
import type { ApprovalItem } from '@/components/workflow/ApprovalInbox';

const mockItems: ApprovalItem[] = [
  {
    id: 'a-1',
    objectName: 'leave_request',
    objectLabel: 'Leave Request',
    recordId: 'lr-001',
    recordTitle: 'John Doe — Annual Leave',
    workflowStatus: {
      workflowName: 'leave_request_flow',
      currentState: 'pending',
      currentStateLabel: 'Pending',
      color: 'yellow',
      availableTransitions: [
        { name: 'approve', label: 'Approve', from: 'pending', to: 'approved' },
        { name: 'reject', label: 'Reject', from: 'pending', to: 'rejected' },
      ],
    },
    submittedBy: 'John Doe',
    submittedAt: '2025-02-10T09:00:00Z',
    detailPath: '/apps/hrm/leave_request/lr-001',
  },
];

describe('ApprovalInbox', () => {
  it('renders the inbox title', () => {
    render(
      <MemoryRouter>
        <ApprovalInbox items={mockItems} onApprove={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Approval Inbox')).toBeDefined();
  });

  it('shows pending count badge', () => {
    render(
      <MemoryRouter>
        <ApprovalInbox items={mockItems} onApprove={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('1 pending')).toBeDefined();
  });

  it('renders approval item details', () => {
    render(
      <MemoryRouter>
        <ApprovalInbox items={mockItems} onApprove={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Leave Request')).toBeDefined();
  });

  it('shows approve and reject buttons', () => {
    render(
      <MemoryRouter>
        <ApprovalInbox items={mockItems} onApprove={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Approve')).toBeDefined();
    expect(screen.getByText('Reject')).toBeDefined();
  });

  it('shows empty state when no items', () => {
    render(
      <MemoryRouter>
        <ApprovalInbox items={[]} onApprove={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('All caught up!')).toBeDefined();
  });
});
