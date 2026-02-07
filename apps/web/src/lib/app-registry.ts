export type AppRegistryEntry = {
  id: string;
  name: string;
  description: string;
  href: string;
  status: 'active' | 'paused';
};

export const mockApps: AppRegistryEntry[] = [
  {
    id: 'console',
    name: 'Console',
    description: 'System administration and settings.',
    href: '/dashboard',
    status: 'active',
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Leads, accounts, and pipeline management.',
    href: '/apps/crm',
    status: 'active',
  },
  {
    id: 'hrm',
    name: 'HRM',
    description: 'People, teams, and HR workflows.',
    href: '/apps/hrm',
    status: 'active',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Billing, invoices, and approvals.',
    href: '/apps/finance',
    status: 'paused',
  },
];

export const getAppById = (appId: string | undefined) =>
  mockApps.find((app) => app.id === appId);
