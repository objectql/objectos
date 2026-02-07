export type AppRegistryEntry = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: 'system' | 'business' | 'custom';
  status: 'active' | 'paused';
  pinned?: boolean;
};

export const mockApps: AppRegistryEntry[] = [
  {
    id: 'console',
    name: 'Console',
    description: 'System administration and settings.',
    href: '/settings',
    category: 'system',
    status: 'active',
    pinned: true,
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Leads, accounts, and pipeline management.',
    href: '/apps/crm',
    category: 'business',
    status: 'active',
    pinned: true,
  },
  {
    id: 'hrm',
    name: 'HRM',
    description: 'People, teams, and HR workflows.',
    href: '/apps/hrm',
    category: 'business',
    status: 'active',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Billing, invoices, and approvals.',
    href: '/apps/finance',
    category: 'business',
    status: 'paused',
  },
  {
    id: 'custom-ops',
    name: 'Ops Suite',
    description: 'Custom operational workflows for your team.',
    href: '/apps/custom-ops',
    category: 'custom',
    status: 'active',
  },
];

export const getAppById = (appId: string | undefined) =>
  mockApps.find((app) => app.id === appId);
