import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Grid3X3, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { mockApps } from '@/lib/app-registry';

interface AppSwitcherProps {
  /** "sidebar" = full sidebar header style, "topbar" = compact button for top bar */
  variant?: 'sidebar' | 'topbar';
}

function useAppSwitcherState() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const activeApp = useMemo(() => {
    if (pathname.startsWith('/apps/')) {
      const [, , appId] = pathname.split('/');
      return mockApps.find((app) => app.id === appId);
    }
    if (pathname.startsWith('/settings')) {
      return mockApps.find((app) => app.id === 'console');
    }
    return mockApps.find((app) => app.id === 'console');
  }, [pathname]);

  const displayName = activeApp?.name ?? 'Console';

  const filteredApps = useMemo(() => {
    if (!normalizedQuery) return mockApps;
    return mockApps.filter((app) => {
      const haystack = `${app.name} ${app.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const pinnedApps = filteredApps.filter((app) => app.pinned);
  const systemApps = filteredApps.filter(
    (app) => app.category === 'system' && !app.pinned,
  );
  const businessApps = filteredApps.filter(
    (app) => app.category === 'business' && !app.pinned,
  );
  const customApps = filteredApps.filter(
    (app) => app.category === 'custom' && !app.pinned,
  );

  return {
    navigate,
    query,
    setQuery,
    displayName,
    filteredApps,
    pinnedApps,
    systemApps,
    businessApps,
    customApps,
  };
}

function AppDropdownBody({
  query,
  setQuery,
  navigate,
  pinnedApps,
  systemApps,
  businessApps,
  customApps,
  filteredApps,
}: ReturnType<typeof useAppSwitcherState>) {
  const renderAppItem = (app: (typeof mockApps)[number]) => (
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
        <span className="text-xs text-muted-foreground">{app.description}</span>
      </div>
    </DropdownMenuItem>
  );

  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Search
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="p-2"
        onSelect={(event) => event.preventDefault()}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search apps"
          onKeyDown={(event) => event.stopPropagation()}
        />
      </DropdownMenuItem>

      <div className="max-h-[50vh] overflow-auto">
        {pinnedApps.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Pinned
            </DropdownMenuLabel>
            {pinnedApps.map(renderAppItem)}
          </>
        )}

        {systemApps.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              System
            </DropdownMenuLabel>
            {systemApps.map(renderAppItem)}
          </>
        )}

        {businessApps.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Business
            </DropdownMenuLabel>
            {businessApps.map(renderAppItem)}
          </>
        )}

        {customApps.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Custom
            </DropdownMenuLabel>
            {customApps.map(renderAppItem)}
          </>
        )}

        {filteredApps.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No apps match your search.
          </div>
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Administration
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="gap-2 p-2 text-muted-foreground"
        onClick={() => navigate('/settings/packages')}
      >
        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
          <Package className="size-3" />
        </div>
        Manage packages
      </DropdownMenuItem>
    </>
  );
}

export function AppSwitcher({ variant = 'sidebar' }: AppSwitcherProps) {
  const state = useAppSwitcherState();

  if (variant === 'topbar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Grid3X3 className="size-4" />
            <span className="hidden sm:inline">{state.displayName}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64 rounded-lg">
          <AppDropdownBody {...state} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default: sidebar variant
  const { isMobile } = useSidebar();

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
                <span className="truncate font-medium">{state.displayName}</span>
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
            <AppDropdownBody {...state} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
