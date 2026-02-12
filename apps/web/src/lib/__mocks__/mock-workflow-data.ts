/**
 * Mock workflow, automation, and activity data for development.
 *
 * Provides realistic sample data so the Workflow & Automation UI can be
 * developed and tested before the server endpoints are available.
 */

import type {
  WorkflowDefinition,
  WorkflowStatus,
  AutomationRule,
  ActivityEntry,
  ChartConfig,
} from '@/types/workflow';

// ── Workflow Definitions ────────────────────────────────────────

export const mockWorkflowDefinitions: Record<string, WorkflowDefinition> = {
  leave_request_flow: {
    name: 'leave_request_flow',
    label: 'Leave Request Approval',
    object: 'leave_request',
    stateField: 'status',
    states: [
      { name: 'pending', label: 'Pending', initial: true, color: 'yellow' },
      { name: 'approved', label: 'Approved', final: true, color: 'green' },
      { name: 'rejected', label: 'Rejected', final: true, color: 'red' },
    ],
    transitions: [
      { name: 'approve', label: 'Approve', from: 'pending', to: 'approved', guard: 'isManager', actions: ['notify_employee'] },
      { name: 'reject', label: 'Reject', from: 'pending', to: 'rejected', guard: 'isManager', actions: ['notify_employee'] },
    ],
  },
  opportunity_pipeline: {
    name: 'opportunity_pipeline',
    label: 'Opportunity Pipeline',
    object: 'opportunity',
    stateField: 'stage',
    states: [
      { name: 'prospecting', label: 'Prospecting', initial: true, color: 'blue' },
      { name: 'qualification', label: 'Qualification', color: 'blue' },
      { name: 'proposal', label: 'Proposal', color: 'yellow' },
      { name: 'negotiation', label: 'Negotiation', color: 'purple' },
      { name: 'closed_won', label: 'Closed Won', final: true, color: 'green' },
      { name: 'closed_lost', label: 'Closed Lost', final: true, color: 'red' },
    ],
    transitions: [
      { name: 'qualify', label: 'Qualify', from: 'prospecting', to: 'qualification' },
      { name: 'propose', label: 'Send Proposal', from: 'qualification', to: 'proposal' },
      { name: 'negotiate', label: 'Negotiate', from: 'proposal', to: 'negotiation' },
      { name: 'close_won', label: 'Close Won', from: 'negotiation', to: 'closed_won', actions: ['notify_team'] },
      { name: 'close_lost', label: 'Close Lost', from: 'negotiation', to: 'closed_lost' },
      { name: 'requalify', label: 'Re-qualify', from: 'proposal', to: 'qualification' },
    ],
  },
  invoice_lifecycle: {
    name: 'invoice_lifecycle',
    label: 'Invoice Lifecycle',
    object: 'invoice',
    stateField: 'status',
    states: [
      { name: 'draft', label: 'Draft', initial: true, color: 'default' },
      { name: 'sent', label: 'Sent', color: 'blue' },
      { name: 'paid', label: 'Paid', final: true, color: 'green' },
      { name: 'overdue', label: 'Overdue', color: 'red' },
    ],
    transitions: [
      { name: 'send', label: 'Send', from: 'draft', to: 'sent', actions: ['send_email'] },
      { name: 'mark_paid', label: 'Mark Paid', from: 'sent', to: 'paid' },
      { name: 'mark_overdue', label: 'Mark Overdue', from: 'sent', to: 'overdue' },
      { name: 'mark_paid_late', label: 'Mark Paid', from: 'overdue', to: 'paid' },
    ],
  },
  task_workflow: {
    name: 'task_workflow',
    label: 'Task Workflow',
    object: 'task',
    stateField: 'status',
    states: [
      { name: 'todo', label: 'To Do', initial: true, color: 'default' },
      { name: 'in_progress', label: 'In Progress', color: 'blue' },
      { name: 'done', label: 'Done', final: true, color: 'green' },
    ],
    transitions: [
      { name: 'start', label: 'Start', from: 'todo', to: 'in_progress' },
      { name: 'complete', label: 'Complete', from: 'in_progress', to: 'done' },
      { name: 'reopen', label: 'Reopen', from: 'done', to: 'todo' },
    ],
  },
};

// ── Workflow Status per Record ──────────────────────────────────

export const mockWorkflowStatuses: Record<string, WorkflowStatus> = {
  'lr-001': {
    workflowName: 'leave_request_flow',
    currentState: 'approved',
    currentStateLabel: 'Approved',
    color: 'green',
    availableTransitions: [],
    canApprove: false,
  },
  'lr-002': {
    workflowName: 'leave_request_flow',
    currentState: 'pending',
    currentStateLabel: 'Pending',
    color: 'yellow',
    availableTransitions: [
      { name: 'approve', label: 'Approve', from: 'pending', to: 'approved', guard: 'isManager', actions: ['notify_employee'] },
      { name: 'reject', label: 'Reject', from: 'pending', to: 'rejected', guard: 'isManager', actions: ['notify_employee'] },
    ],
    canApprove: true,
  },
  'opp-001': {
    workflowName: 'opportunity_pipeline',
    currentState: 'proposal',
    currentStateLabel: 'Proposal',
    color: 'yellow',
    availableTransitions: [
      { name: 'negotiate', label: 'Negotiate', from: 'proposal', to: 'negotiation' },
      { name: 'requalify', label: 'Re-qualify', from: 'proposal', to: 'qualification' },
    ],
  },
  'task-001': {
    workflowName: 'task_workflow',
    currentState: 'in_progress',
    currentStateLabel: 'In Progress',
    color: 'blue',
    availableTransitions: [
      { name: 'complete', label: 'Complete', from: 'in_progress', to: 'done' },
    ],
  },
};

// ── Automation Rules ────────────────────────────────────────────

export const mockAutomationRules: AutomationRule[] = [
  {
    id: 'rule-001',
    name: 'Auto-assign new leads',
    description: 'Automatically assign new leads to the sales team round-robin.',
    object: 'lead',
    active: true,
    trigger: { type: 'record_created', object: 'lead' },
    conditions: [
      { field: 'status', operator: 'equals', value: 'new' },
    ],
    actions: [
      { type: 'assign_record', label: 'Assign to Sales Team', config: { team: 'sales', method: 'round_robin' } },
      { type: 'send_notification', label: 'Notify Assignee', config: { template: 'new_lead_assigned' } },
    ],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
  },
  {
    id: 'rule-002',
    name: 'Overdue invoice reminder',
    description: 'Send email reminder when invoice becomes overdue.',
    object: 'invoice',
    active: true,
    trigger: { type: 'field_changed', object: 'invoice', field: 'status' },
    conditions: [
      { field: 'status', operator: 'equals', value: 'overdue' },
    ],
    actions: [
      { type: 'send_email', label: 'Send Reminder Email', config: { template: 'overdue_reminder', to: '{{customer_email}}' } },
    ],
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-12T09:00:00Z',
  },
  {
    id: 'rule-003',
    name: 'Close won notification',
    description: 'Notify the team when a deal is closed won.',
    object: 'opportunity',
    active: true,
    trigger: { type: 'workflow_transition', object: 'opportunity' },
    conditions: [
      { field: 'stage', operator: 'equals', value: 'closed_won' },
    ],
    actions: [
      { type: 'send_notification', label: 'Notify Team', config: { channel: '#sales-wins', template: 'deal_won' } },
      { type: 'update_record', label: 'Set Close Date', config: { field: 'close_date', value: '{{now}}' } },
    ],
    createdAt: '2025-01-14T11:00:00Z',
    updatedAt: '2025-01-20T16:00:00Z',
  },
  {
    id: 'rule-004',
    name: 'Task due date reminder',
    description: 'Send reminder 1 day before task due date.',
    object: 'task',
    active: false,
    trigger: { type: 'schedule', schedule: '0 9 * * *' },
    conditions: [
      { field: 'status', operator: 'not_equals', value: 'done' },
    ],
    actions: [
      { type: 'send_notification', label: 'Due Date Reminder', config: { template: 'task_due_soon' } },
    ],
    createdAt: '2025-01-16T08:00:00Z',
    updatedAt: '2025-01-16T08:00:00Z',
  },
];

// ── Activity Entries ────────────────────────────────────────────

export const mockActivities: Record<string, ActivityEntry[]> = {
  'lr-002': [
    {
      id: 'act-001',
      type: 'record_created',
      timestamp: '2025-02-04T08:00:00Z',
      user: 'Jane Smith',
      summary: 'Created leave request',
    },
    {
      id: 'act-002',
      type: 'comment',
      timestamp: '2025-02-04T09:30:00Z',
      user: 'Bob Manager',
      summary: 'Added a comment',
      comment: 'I\'ll review this by end of day.',
    },
  ],
  'opp-001': [
    {
      id: 'act-003',
      type: 'record_created',
      timestamp: '2025-01-20T10:00:00Z',
      user: 'Alice Johnson',
      summary: 'Created opportunity',
    },
    {
      id: 'act-004',
      type: 'field_changed',
      timestamp: '2025-01-22T14:00:00Z',
      user: 'Alice Johnson',
      summary: 'Updated amount',
      changes: [{ field: 'amount', fieldLabel: 'Amount', oldValue: 100000, newValue: 150000 }],
    },
    {
      id: 'act-005',
      type: 'workflow_transition',
      timestamp: '2025-01-25T11:00:00Z',
      user: 'Bob Smith',
      summary: 'Moved to Proposal stage',
      fromState: 'qualification',
      toState: 'proposal',
    },
    {
      id: 'act-006',
      type: 'email_sent',
      timestamp: '2025-01-25T11:05:00Z',
      user: 'System',
      summary: 'Sent proposal email to client',
    },
  ],
  'task-001': [
    {
      id: 'act-007',
      type: 'record_created',
      timestamp: '2025-01-20T09:00:00Z',
      user: 'Admin',
      summary: 'Created task',
    },
    {
      id: 'act-008',
      type: 'workflow_transition',
      timestamp: '2025-01-21T10:00:00Z',
      user: 'John Doe',
      summary: 'Started working on task',
      fromState: 'todo',
      toState: 'in_progress',
    },
    {
      id: 'act-009',
      type: 'comment',
      timestamp: '2025-01-22T15:00:00Z',
      user: 'John Doe',
      summary: 'Added a comment',
      comment: 'Pipeline config is ready, testing deployment now.',
    },
  ],
};

// ── Chart Configs ───────────────────────────────────────────────

export const mockChartConfigs: Record<string, ChartConfig[]> = {
  crm: [
    {
      type: 'bar',
      title: 'Leads by Status',
      description: 'Distribution of leads across pipeline stages',
      groupField: 'status',
      valueField: 'count',
      data: [
        { label: 'New', value: 2, color: '#3b82f6' },
        { label: 'Contacted', value: 1, color: '#8b5cf6' },
        { label: 'Qualified', value: 1, color: '#22c55e' },
        { label: 'Lost', value: 1, color: '#ef4444' },
      ],
    },
    {
      type: 'donut',
      title: 'Opportunity Stages',
      description: 'Current pipeline distribution',
      groupField: 'stage',
      valueField: 'count',
      data: [
        { label: 'Qualification', value: 1, color: '#3b82f6' },
        { label: 'Proposal', value: 1, color: '#f59e0b' },
      ],
    },
    {
      type: 'number',
      title: 'Total Pipeline Value',
      description: 'Sum of all open opportunities',
      data: [{ label: 'Total', value: 175000 }],
    },
  ],
  hrm: [
    {
      type: 'pie',
      title: 'Employees by Department',
      groupField: 'department',
      valueField: 'count',
      data: [
        { label: 'Engineering', value: 42, color: '#3b82f6' },
        { label: 'Marketing', value: 15, color: '#8b5cf6' },
        { label: 'Sales', value: 28, color: '#22c55e' },
      ],
    },
    {
      type: 'number',
      title: 'Total Employees',
      data: [{ label: 'Total', value: 85 }],
    },
  ],
};

// ── Lookup Helpers ──────────────────────────────────────────────

export function getMockWorkflowDefinition(objectName: string): WorkflowDefinition | undefined {
  return Object.values(mockWorkflowDefinitions).find((w) => w.object === objectName);
}

export function getMockWorkflowStatus(recordId: string): WorkflowStatus | undefined {
  return mockWorkflowStatuses[recordId];
}

export function getMockAutomationRules(objectName?: string): AutomationRule[] {
  if (!objectName) return mockAutomationRules;
  return mockAutomationRules.filter((r) => r.object === objectName);
}

export function getMockActivities(recordId: string): ActivityEntry[] {
  return mockActivities[recordId] ?? [];
}

export function getMockChartConfigs(appId: string): ChartConfig[] {
  return mockChartConfigs[appId] ?? [];
}
