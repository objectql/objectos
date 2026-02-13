import { useNavigate } from 'react-router-dom';
import { organization, useActiveOrganization, useListOrganizations } from '@/lib/auth-client';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function OrgSwitcher() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useListOrganizations();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;
    await organization.setActive({ organizationId: orgId });
    // Reload settings data for the new org
    window.location.reload();
  };

  const orgName = activeOrg?.name || 'Select Organization';
  const orgSlug = activeOrg?.slug || '';
  const initials = orgName.charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                {initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{orgName}</span>
                {orgSlug && (
                  <span className="truncate text-xs text-muted-foreground">{orgSlug}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background text-xs font-semibold">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate">{org.name}</span>
                {activeOrg?.id === org.id && <Check className="size-4 text-muted-foreground" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => navigate('/settings/organization/create')}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <span className="text-muted-foreground">Add organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
