import { Link, useLocation, Outlet } from 'react-router-dom';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { UserDropdown } from './UserDropdown';
import { Blocks, LayoutDashboard, Users, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-background border-b h-14">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <Blocks className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ObjectOS</span>
          </Link>

          <div className="flex items-center gap-3">
            <OrganizationSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <UserDropdown />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed top-14 left-0 z-40 hidden w-56 h-[calc(100vh-3.5rem)] border-r bg-background sm:block">
        <div className="flex flex-col gap-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="size-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-14 sm:pl-56">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
