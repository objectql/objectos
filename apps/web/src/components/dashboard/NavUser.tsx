import { useNavigate } from 'react-router-dom';
import {
  signOut,
  useSession,
  organization,
  useActiveOrganization,
  useListOrganizations,
} from '@/lib/auth-client';
import { BadgeCheck, Building2, Check, ChevronsUpDown, LogOut, Plus, Shield } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

export function NavUser() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useListOrganizations();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  if (!session?.user) return null;

  const user = session.user;
  const initials = user.name?.charAt(0) || user.email?.charAt(0) || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;
    await organization.setActive({ organizationId: orgId });
    window.location.reload();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="default"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-7 rounded-md">
                <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name || 'User'}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || 'User'}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations && organizations.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Organizations
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {organizations.map((org) => (
                    <DropdownMenuItem key={org.id} onClick={() => handleSwitchOrg(org.id)}>
                      <Building2 className="size-4" />
                      <span className="flex-1 truncate">{org.name}</span>
                      {activeOrg?.id === org.id && (
                        <Check className="size-4 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => navigate('/settings/organization/create')}>
                    <Plus className="size-4" />
                    Add organization
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/settings/account')}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/security')}>
                <Shield />
                Security
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
