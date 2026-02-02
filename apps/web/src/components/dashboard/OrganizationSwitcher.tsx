"use client";

import { useSession, useListOrganizations, organization, useActiveOrganization } from "@/lib/auth-client";
import { useState } from "react";

export function OrganizationSwitcher() {
  const { data: organizations, isPending } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const [isOpen, setIsOpen] = useState(false);

  // If no orgs, maybe show "Create Organization" or fallback
  if (isPending) return <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>;

  const handleSwitchOrg = async (orgId: string) => {
    await organization.setActive({
        organizationId: orgId
    });
    setIsOpen(false);
  };

  const currentOrg = organizations?.find(o => o.id === activeOrg?.id) || organizations?.[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs text-white">
            {currentOrg?.name?.charAt(0).toUpperCase() || "P"}
        </div>
        <span className="max-w-[100px] truncate">{currentOrg?.name || "Personal"}</span>
        <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Organizations
            </div>
            {organizations?.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${activeOrg?.id === org.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                role="menuitem"
              >
                  <span className={`w-2 h-2 rounded-full ${activeOrg?.id === org.id ? 'bg-blue-500' : 'bg-transparent'}`}></span>
                  {org.name}
              </button>
            ))}
            
            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
            
            <button
                onClick={() => {
                     // TODO: Open Create Org Modal or Redirect
                     setIsOpen(false);
                     window.location.href = "/organization/create";
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
