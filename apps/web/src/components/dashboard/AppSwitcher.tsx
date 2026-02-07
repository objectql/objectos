import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { mockApps } from '@/lib/app-registry';

export function AppSwitcher() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isMobile } = useSidebar();

  const activeApp = useMemo(() => {
    if (pathname.startsWith('/apps/')) {
      const [, , appId] = pathname.split('/');
      return mockApps.find((app) => app.id === appId);
    }
    return mockApps.find((app) => app.id === 'console');
  }, [pathname]);

  const displayName = activeApp?.name ?? 'Console';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Grid3X3 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Business Apps
                </span>
              </div>
              <ChevronDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Business Apps
            </DropdownMenuLabel>
            {mockApps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                className="flex items-start gap-2"
                onClick={() => navigate(app.href)}
              >
                <div className="mt-0.5 flex size-6 items-center justify-center rounded-md border">
                  <Grid3X3 className="size-3" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{app.name}</span>
                    {app.status === 'paused' && (
                      <Badge variant="outline" className="text-xs">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {app.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/packages')}>
              Manage packages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
