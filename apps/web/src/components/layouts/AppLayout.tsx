import { Link, useLocation, useParams, Outlet } from 'react-router-dom';
import { Blocks, Database, LayoutDashboard } from 'lucide-react';
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
import { AppSwitcher } from '@/components/dashboard/AppSwitcher';
import { NavUser } from '@/components/dashboard/NavUser';
import { useAppDefinition, useObjectDefinition } from '@/hooks/use-metadata';

/** Helper: resolve an object name to its plural label for the sidebar. */
function ObjectNavLabel({ objectName }: { objectName: string }) {
  const { data: objectDef } = useObjectDefinition(objectName);
  return <span>{objectDef?.pluralLabel ?? objectDef?.label ?? objectName}</span>;
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { appId } = useParams();

  const { data: appDef } = useAppDefinition(appId);
  const appName = appDef?.label ?? appId ?? 'App';
  const objectNames = appDef?.objects ?? [];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppSwitcher />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{appName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* App home link */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/apps/${appId}`}
                    tooltip="Home"
                  >
                    <Link to={`/apps/${appId}`}>
                      <LayoutDashboard />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Object links from metadata */}
                {objectNames.map((objectName) => {
                  const href = `/apps/${appId}/${objectName}`;
                  const isActive = pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={objectName}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={objectName}>
                        <Link to={href}>
                          <Database />
                          <ObjectNavLabel objectName={objectName} />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Blocks className="size-5 text-primary" />
            <span className="font-semibold">{appName}</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
