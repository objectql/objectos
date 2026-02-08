import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from '@/components/workflow/ActivityTimeline';
import type { ActivityEntry } from '@/types/workflow';

const sampleActivities: ActivityEntry[] = [
  {
    id: 'act-1',
    type: 'record_created',
    timestamp: '2025-01-01T10:00:00Z',
    user: 'Alice',
    summary: 'Created record',
  },
  {
    id: 'act-2',
    type: 'field_changed',
    timestamp: '2025-01-02T14:00:00Z',
    user: 'Bob',
    summary: 'Updated status',
    changes: [{ field: 'status', fieldLabel: 'Status', oldValue: 'draft', newValue: 'sent' }],
  },
  {
    id: 'act-3',
    type: 'comment',
    timestamp: '2025-01-03T09:00:00Z',
    user: 'Carol',
    summary: 'Added a comment',
    comment: 'This looks good!',
  },
];

describe('ActivityTimeline', () => {
  it('renders empty state when no activities', () => {
    render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText('No activity yet.')).toBeDefined();
  });

  it('renders activity entries', () => {
    render(<ActivityTimeline activities={sampleActivities} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('Carol')).toBeDefined();
  });

  it('renders field changes with old/new values', () => {
    render(<ActivityTimeline activities={sampleActivities} />);
    expect(screen.getByText('Status:')).toBeDefined();
    expect(screen.getByText('draft')).toBeDefined();
    expect(screen.getByText('sent')).toBeDefined();
  });

  it('renders comment body', () => {
    render(<ActivityTimeline activities={sampleActivities} />);
    expect(screen.getByText('This looks good!')).toBeDefined();
  });

  it('respects maxItems prop', () => {
    render(<ActivityTimeline activities={sampleActivities} maxItems={1} />);
    expect(screen.getByText('Alice')).toBeDefined();
    // Bob and Carol should not be visible
    expect(screen.queryByText('Bob')).toBeNull();
    expect(screen.getByText('+2 more activities')).toBeDefined();
  });

  it('has data-testid attribute', () => {
    render(<ActivityTimeline activities={sampleActivities} />);
    expect(screen.getByTestId('activity-timeline')).toBeDefined();
  });
});
