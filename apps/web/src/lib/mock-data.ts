/**
 * Mock metadata and records for development.
 *
 * Provides realistic sample data so the Business App Shell can be developed
 * and tested before the server metadata endpoints are available.
 * The mock layer implements the same interface as the real API so switching
 * to live data requires zero page-level changes.
 */

import type {
  AppDefinition,
  ObjectDefinition,
  RecordData,
} from '@/types/metadata';

// ── App Definitions ─────────────────────────────────────────────

export const mockAppDefinitions: AppDefinition[] = [
  {
    id: 'crm',
    name: 'CRM',
    description: 'Leads, accounts, and pipeline management.',
    icon: 'briefcase',
    objects: ['lead', 'account', 'opportunity', 'contact'],
    defaultObject: 'lead',
    status: 'active',
    category: 'business',
  },
  {
    id: 'hrm',
    name: 'HRM',
    description: 'People, teams, and HR workflows.',
    icon: 'users',
    objects: ['employee', 'department', 'leave_request'],
    defaultObject: 'employee',
    status: 'active',
    category: 'business',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Billing, invoices, and approvals.',
    icon: 'dollar-sign',
    objects: ['invoice', 'payment'],
    defaultObject: 'invoice',
    status: 'paused',
    category: 'business',
  },
  {
    id: 'custom-ops',
    name: 'Ops Suite',
    description: 'Custom operational workflows for your team.',
    icon: 'settings',
    objects: ['task', 'project'],
    defaultObject: 'task',
    status: 'active',
    category: 'custom',
  },
];

// ── Object Definitions ──────────────────────────────────────────

export const mockObjectDefinitions: Record<string, ObjectDefinition> = {
  lead: {
    name: 'lead',
    label: 'Lead',
    pluralLabel: 'Leads',
    icon: 'user-plus',
    description: 'Potential customers and prospects.',
    primaryField: 'name',
    listFields: ['name', 'email', 'company', 'status', 'source'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Name', required: true },
      email: { name: 'email', type: 'email', label: 'Email', required: true },
      phone: { name: 'phone', type: 'phone', label: 'Phone' },
      company: { name: 'company', type: 'text', label: 'Company' },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'New', value: 'new' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Qualified', value: 'qualified' },
          { label: 'Lost', value: 'lost' },
        ],
        defaultValue: 'new',
      },
      source: {
        name: 'source',
        type: 'select',
        label: 'Source',
        options: [
          { label: 'Website', value: 'website' },
          { label: 'Referral', value: 'referral' },
          { label: 'Cold Call', value: 'cold_call' },
          { label: 'Event', value: 'event' },
        ],
      },
      notes: { name: 'notes', type: 'textarea', label: 'Notes' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  account: {
    name: 'account',
    label: 'Account',
    pluralLabel: 'Accounts',
    icon: 'building',
    description: 'Customer organizations and companies.',
    primaryField: 'name',
    listFields: ['name', 'industry', 'website', 'employees'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Account Name', required: true },
      industry: {
        name: 'industry',
        type: 'select',
        label: 'Industry',
        options: [
          { label: 'Technology', value: 'technology' },
          { label: 'Finance', value: 'finance' },
          { label: 'Healthcare', value: 'healthcare' },
          { label: 'Education', value: 'education' },
          { label: 'Manufacturing', value: 'manufacturing' },
        ],
      },
      website: { name: 'website', type: 'url', label: 'Website' },
      employees: { name: 'employees', type: 'number', label: 'Employees' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  opportunity: {
    name: 'opportunity',
    label: 'Opportunity',
    pluralLabel: 'Opportunities',
    icon: 'target',
    description: 'Sales opportunities and deals.',
    primaryField: 'name',
    listFields: ['name', 'amount', 'stage', 'close_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Opportunity Name', required: true },
      amount: { name: 'amount', type: 'currency', label: 'Amount' },
      stage: {
        name: 'stage',
        type: 'select',
        label: 'Stage',
        options: [
          { label: 'Prospecting', value: 'prospecting' },
          { label: 'Qualification', value: 'qualification' },
          { label: 'Proposal', value: 'proposal' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ],
        defaultValue: 'prospecting',
      },
      close_date: { name: 'close_date', type: 'datetime', label: 'Close Date' },
      account_id: { name: 'account_id', type: 'reference', label: 'Account', referenceTo: 'account' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  contact: {
    name: 'contact',
    label: 'Contact',
    pluralLabel: 'Contacts',
    icon: 'contact',
    description: 'Individual people associated with accounts.',
    primaryField: 'name',
    listFields: ['name', 'email', 'phone', 'title'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Full Name', required: true },
      email: { name: 'email', type: 'email', label: 'Email', required: true },
      phone: { name: 'phone', type: 'phone', label: 'Phone' },
      title: { name: 'title', type: 'text', label: 'Job Title' },
      account_id: { name: 'account_id', type: 'reference', label: 'Account', referenceTo: 'account' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  employee: {
    name: 'employee',
    label: 'Employee',
    pluralLabel: 'Employees',
    icon: 'user',
    description: 'Company employees and team members.',
    primaryField: 'name',
    listFields: ['name', 'email', 'department', 'position', 'hire_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Full Name', required: true },
      email: { name: 'email', type: 'email', label: 'Work Email', required: true },
      department: { name: 'department', type: 'text', label: 'Department' },
      position: { name: 'position', type: 'text', label: 'Position' },
      hire_date: { name: 'hire_date', type: 'datetime', label: 'Hire Date' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  department: {
    name: 'department',
    label: 'Department',
    pluralLabel: 'Departments',
    icon: 'building-2',
    description: 'Organizational departments.',
    primaryField: 'name',
    listFields: ['name', 'head', 'employee_count'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Department Name', required: true },
      head: { name: 'head', type: 'text', label: 'Department Head' },
      employee_count: { name: 'employee_count', type: 'number', label: 'Employees' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  leave_request: {
    name: 'leave_request',
    label: 'Leave Request',
    pluralLabel: 'Leave Requests',
    icon: 'calendar',
    description: 'Employee leave and time-off requests.',
    primaryField: 'employee_name',
    listFields: ['employee_name', 'type', 'start_date', 'end_date', 'status'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      employee_name: { name: 'employee_name', type: 'text', label: 'Employee', required: true },
      type: {
        name: 'type',
        type: 'select',
        label: 'Leave Type',
        options: [
          { label: 'Annual', value: 'annual' },
          { label: 'Sick', value: 'sick' },
          { label: 'Personal', value: 'personal' },
        ],
      },
      start_date: { name: 'start_date', type: 'datetime', label: 'Start Date', required: true },
      end_date: { name: 'end_date', type: 'datetime', label: 'End Date', required: true },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
        defaultValue: 'pending',
      },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  invoice: {
    name: 'invoice',
    label: 'Invoice',
    pluralLabel: 'Invoices',
    icon: 'file-text',
    description: 'Billing invoices and payment tracking.',
    primaryField: 'invoice_number',
    listFields: ['invoice_number', 'customer', 'amount', 'status', 'due_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      invoice_number: { name: 'invoice_number', type: 'text', label: 'Invoice #', required: true },
      customer: { name: 'customer', type: 'text', label: 'Customer', required: true },
      amount: { name: 'amount', type: 'currency', label: 'Amount', required: true },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' },
        ],
        defaultValue: 'draft',
      },
      due_date: { name: 'due_date', type: 'datetime', label: 'Due Date' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  payment: {
    name: 'payment',
    label: 'Payment',
    pluralLabel: 'Payments',
    icon: 'credit-card',
    description: 'Payment records and transactions.',
    primaryField: 'reference',
    listFields: ['reference', 'amount', 'method', 'status', 'payment_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      reference: { name: 'reference', type: 'text', label: 'Reference', required: true },
      amount: { name: 'amount', type: 'currency', label: 'Amount', required: true },
      method: {
        name: 'method',
        type: 'select',
        label: 'Method',
        options: [
          { label: 'Bank Transfer', value: 'bank_transfer' },
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Cash', value: 'cash' },
        ],
      },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
        ],
        defaultValue: 'pending',
      },
      payment_date: { name: 'payment_date', type: 'datetime', label: 'Payment Date' },
      invoice_id: { name: 'invoice_id', type: 'reference', label: 'Invoice', referenceTo: 'invoice' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  task: {
    name: 'task',
    label: 'Task',
    pluralLabel: 'Tasks',
    icon: 'check-square',
    description: 'Work items and action items.',
    primaryField: 'title',
    listFields: ['title', 'assignee', 'priority', 'status', 'due_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      title: { name: 'title', type: 'text', label: 'Title', required: true },
      description: { name: 'description', type: 'textarea', label: 'Description' },
      assignee: { name: 'assignee', type: 'text', label: 'Assignee' },
      priority: {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ],
        defaultValue: 'medium',
      },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'To Do', value: 'todo' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Done', value: 'done' },
        ],
        defaultValue: 'todo',
      },
      due_date: { name: 'due_date', type: 'datetime', label: 'Due Date' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
  project: {
    name: 'project',
    label: 'Project',
    pluralLabel: 'Projects',
    icon: 'folder',
    description: 'Projects and initiatives.',
    primaryField: 'name',
    listFields: ['name', 'status', 'start_date', 'end_date'],
    fields: {
      id: { name: 'id', type: 'text', label: 'ID', readonly: true },
      name: { name: 'name', type: 'text', label: 'Project Name', required: true },
      description: { name: 'description', type: 'textarea', label: 'Description' },
      status: {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { label: 'Planning', value: 'planning' },
          { label: 'Active', value: 'active' },
          { label: 'On Hold', value: 'on_hold' },
          { label: 'Completed', value: 'completed' },
        ],
        defaultValue: 'planning',
      },
      start_date: { name: 'start_date', type: 'datetime', label: 'Start Date' },
      end_date: { name: 'end_date', type: 'datetime', label: 'End Date' },
      created_at: { name: 'created_at', type: 'datetime', label: 'Created', readonly: true },
    },
  },
};

// ── Mock Records ────────────────────────────────────────────────

export const mockRecords: Record<string, RecordData[]> = {
  lead: [
    { id: 'lead-001', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', company: 'Acme Corp', status: 'new', source: 'website', created_at: '2025-01-15T10:30:00Z' },
    { id: 'lead-002', name: 'Bob Smith', email: 'bob@techstart.io', phone: '+1-555-0102', company: 'TechStart', status: 'contacted', source: 'referral', created_at: '2025-01-16T14:20:00Z' },
    { id: 'lead-003', name: 'Carol Williams', email: 'carol@globalfin.com', phone: '+1-555-0103', company: 'Global Finance', status: 'qualified', source: 'event', created_at: '2025-01-17T09:15:00Z' },
    { id: 'lead-004', name: 'David Brown', email: 'david@startup.co', phone: '+1-555-0104', company: 'StartupCo', status: 'new', source: 'cold_call', created_at: '2025-01-18T16:45:00Z' },
    { id: 'lead-005', name: 'Eve Davis', email: 'eve@cloudnine.io', phone: '+1-555-0105', company: 'Cloud Nine', status: 'lost', source: 'website', created_at: '2025-01-19T11:00:00Z' },
  ],
  account: [
    { id: 'acc-001', name: 'Acme Corporation', industry: 'technology', website: 'https://acme.example.com', employees: 250, created_at: '2025-01-10T08:00:00Z' },
    { id: 'acc-002', name: 'Global Finance Ltd', industry: 'finance', website: 'https://globalfin.example.com', employees: 1200, created_at: '2025-01-11T09:30:00Z' },
    { id: 'acc-003', name: 'HealthFirst Inc', industry: 'healthcare', website: 'https://healthfirst.example.com', employees: 80, created_at: '2025-01-12T14:00:00Z' },
  ],
  opportunity: [
    { id: 'opp-001', name: 'Acme Enterprise Deal', amount: 150000, stage: 'proposal', close_date: '2025-03-15T00:00:00Z', account_id: 'acc-001', created_at: '2025-01-20T10:00:00Z' },
    { id: 'opp-002', name: 'HealthFirst Pilot', amount: 25000, stage: 'qualification', close_date: '2025-02-28T00:00:00Z', account_id: 'acc-003', created_at: '2025-01-21T11:00:00Z' },
  ],
  contact: [
    { id: 'con-001', name: 'Alice Johnson', email: 'alice@acme.com', phone: '+1-555-0201', title: 'CTO', account_id: 'acc-001', created_at: '2025-01-15T10:00:00Z' },
    { id: 'con-002', name: 'Bob Martinez', email: 'bob@globalfin.com', phone: '+1-555-0202', title: 'VP Engineering', account_id: 'acc-002', created_at: '2025-01-16T10:00:00Z' },
  ],
  employee: [
    { id: 'emp-001', name: 'John Doe', email: 'john@company.com', department: 'Engineering', position: 'Senior Engineer', hire_date: '2023-06-01T00:00:00Z', created_at: '2023-06-01T08:00:00Z' },
    { id: 'emp-002', name: 'Jane Smith', email: 'jane@company.com', department: 'Marketing', position: 'Marketing Manager', hire_date: '2024-01-15T00:00:00Z', created_at: '2024-01-15T08:00:00Z' },
    { id: 'emp-003', name: 'Mike Wilson', email: 'mike@company.com', department: 'Sales', position: 'Sales Rep', hire_date: '2024-03-01T00:00:00Z', created_at: '2024-03-01T08:00:00Z' },
  ],
  department: [
    { id: 'dep-001', name: 'Engineering', head: 'Alice Chen', employee_count: 42, created_at: '2023-01-01T00:00:00Z' },
    { id: 'dep-002', name: 'Marketing', head: 'Jane Smith', employee_count: 15, created_at: '2023-01-01T00:00:00Z' },
    { id: 'dep-003', name: 'Sales', head: 'Bob Johnson', employee_count: 28, created_at: '2023-01-01T00:00:00Z' },
  ],
  leave_request: [
    { id: 'lr-001', employee_name: 'John Doe', type: 'annual', start_date: '2025-02-10T00:00:00Z', end_date: '2025-02-14T00:00:00Z', status: 'approved', created_at: '2025-01-25T09:00:00Z' },
    { id: 'lr-002', employee_name: 'Jane Smith', type: 'sick', start_date: '2025-02-05T00:00:00Z', end_date: '2025-02-06T00:00:00Z', status: 'pending', created_at: '2025-02-04T08:00:00Z' },
  ],
  invoice: [
    { id: 'inv-001', invoice_number: 'INV-2025-001', customer: 'Acme Corp', amount: 15000, status: 'paid', due_date: '2025-02-01T00:00:00Z', created_at: '2025-01-01T10:00:00Z' },
    { id: 'inv-002', invoice_number: 'INV-2025-002', customer: 'TechStart', amount: 8500, status: 'sent', due_date: '2025-02-15T00:00:00Z', created_at: '2025-01-15T10:00:00Z' },
    { id: 'inv-003', invoice_number: 'INV-2025-003', customer: 'Global Finance', amount: 42000, status: 'overdue', due_date: '2025-01-30T00:00:00Z', created_at: '2025-01-02T10:00:00Z' },
  ],
  payment: [
    { id: 'pay-001', reference: 'PAY-2025-001', amount: 15000, method: 'bank_transfer', status: 'completed', payment_date: '2025-01-28T14:00:00Z', invoice_id: 'inv-001', created_at: '2025-01-28T14:00:00Z' },
  ],
  task: [
    { id: 'task-001', title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated deployment', assignee: 'John Doe', priority: 'high', status: 'in_progress', due_date: '2025-02-10T00:00:00Z', created_at: '2025-01-20T09:00:00Z' },
    { id: 'task-002', title: 'Write API documentation', description: 'Document all REST endpoints', assignee: 'Jane Smith', priority: 'medium', status: 'todo', due_date: '2025-02-15T00:00:00Z', created_at: '2025-01-21T09:00:00Z' },
    { id: 'task-003', title: 'Security audit', description: 'Run quarterly security audit', assignee: 'Mike Wilson', priority: 'critical', status: 'todo', due_date: '2025-02-20T00:00:00Z', created_at: '2025-01-22T09:00:00Z' },
  ],
  project: [
    { id: 'proj-001', name: 'Platform v2.0', description: 'Major platform upgrade', status: 'active', start_date: '2025-01-01T00:00:00Z', end_date: '2025-06-30T00:00:00Z', created_at: '2024-12-15T10:00:00Z' },
    { id: 'proj-002', name: 'Mobile App', description: 'Native mobile application', status: 'planning', start_date: '2025-03-01T00:00:00Z', end_date: '2025-09-30T00:00:00Z', created_at: '2025-01-10T10:00:00Z' },
  ],
};

// ── Lookup Helpers ──────────────────────────────────────────────

export function getMockAppDefinition(appId: string): AppDefinition | undefined {
  return mockAppDefinitions.find((a) => a.id === appId);
}

export function getMockObjectDefinition(objectName: string): ObjectDefinition | undefined {
  return mockObjectDefinitions[objectName];
}

export function getMockRecords(objectName: string): RecordData[] {
  return mockRecords[objectName] ?? [];
}

export function getMockRecord(objectName: string, recordId: string): RecordData | undefined {
  return (mockRecords[objectName] ?? []).find((r) => r.id === recordId);
}
