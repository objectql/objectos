import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Blocks,
  Building2,
  KeyRound,
  Mail,
  Package,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  UsersRound,
  ClipboardList,
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Bell,
  Layers,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NavUser } from '@/components/dashboard/NavUser';
import { AppSwitcher } from '@/components/dashboard/AppSwitcher';

const navOverview = [{ title: 'Overview', href: '/settings', icon: LayoutDashboard }];

const navOrganization = [
  { title: 'General', href: '/settings/organization', icon: Building2 },
  { title: 'Members', href: '/settings/members', icon: Users },
  { title: 'Teams', href: '/settings/teams', icon: UsersRound },
  { title: 'Invitations', href: '/settings/invitations', icon: Mail },
];

const navSecurity = [
  { title: 'Permissions', href: '/settings/permissions', icon: ShieldCheck },
  { title: 'Single Sign-On', href: '/settings/sso', icon: KeyRound },
  { title: 'Audit Log', href: '/settings/audit', icon: ClipboardList },
];

const navSystem = [
  { title: 'Packages', href: '/settings/packages', icon: Package },
  { title: 'Plugins', href: '/settings/plugins', icon: Blocks },
  { title: 'Jobs', href: '/settings/jobs', icon: Briefcase },
  { title: 'Metrics', href: '/settings/metrics', icon: BarChart3 },
  { title: 'Notifications', href: '/settings/notifications', icon: Bell },
  { title: 'ObjectUI Demo', href: '/settings/objectui-demo', icon: Layers },
];

const navAccount = [
  { title: 'Profile', href: '/settings/account', icon: Settings },
  { title: 'Security', href: '/settings/security', icon: Shield },
];

export function SettingsLayout() {
  const { pathname } = useLocation();

  const renderGroup = (
    label: string,
    items: { title: string; href: string; icon: React.ElementType }[],
  ) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link to={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppSwitcher />
        </SidebarHeader>

        <SidebarContent>
          {renderGroup('General', navOverview)}
          {renderGroup('Organization', navOrganization)}
          {renderGroup('Security & Compliance', navSecurity)}
          {renderGroup('System', navSystem)}
          {renderGroup('My Account', navAccount)}
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:h-16 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Blocks className="size-5 text-primary" />
            <span className="hidden font-semibold sm:inline">ObjectOS</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
