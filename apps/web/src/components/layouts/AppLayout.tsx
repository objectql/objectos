import { Link, useLocation, useParams, Outlet } from 'react-router-dom';
import { Database, LayoutDashboard, ChevronRight, Clock } from 'lucide-react';
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
import { useRecentItems } from '@/hooks/use-recent-items';

/** Helper: resolve an object name to its plural label for the sidebar. */
function ObjectNavLabel({ objectName }: { objectName: string }) {
  const { data: objectDef } = useObjectDefinition(objectName);
  return <span>{objectDef?.pluralLabel ?? objectDef?.label ?? objectName}</span>;
}

/** Breadcrumb component generated from current route context — H.2.3 */
function Breadcrumbs({
  appName,
  appId,
  objectName,
  recordTitle,
}: {
  appName: string;
  appId: string;
  objectName?: string;
  recordTitle?: string;
}) {
  const items: { label: string; href?: string }[] = [{ label: appName, href: `/apps/${appId}` }];

  if (objectName) {
    items.push({ label: objectName, href: `/apps/${appId}/${objectName}` });
  }

  if (recordTitle) {
    items.push({ label: recordTitle });
  }

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
          {item.href && idx < items.length - 1 ? (
            <Link to={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { appId, objectName, recordId } = useParams();

  const { data: appDef } = useAppDefinition(appId);
  const appName = appDef?.label ?? appId ?? 'App';
  // Dynamic sidebar from metadata — H.2.1, H.2.2
  const objectNames = appDef?.objects ?? [];

  // Recent items — H.2.4
  const { recentItems } = useRecentItems();
  const appRecentItems = recentItems.filter((item) => item.appId === appId).slice(0, 5);

  // Resolve breadcrumb path segments
  const breadcrumbObjectName = objectName;
  const breadcrumbRecordTitle = recordId && recordId !== 'new' ? recordId : undefined;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AppSwitcher />
        </SidebarHeader>

        <SidebarContent>
          {/* Main navigation from app metadata — H.2.1 */}
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

                {/* Object links derived from app metadata — H.2.2 */}
                {objectNames.map((objName) => {
                  const href = `/apps/${appId}/${objName}`;
                  const isActive = pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={objName}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={objName}>
                        <Link to={href}>
                          <Database />
                          <ObjectNavLabel objectName={objName} />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Recent items — H.2.4 */}
          {appRecentItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Recent</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {appRecentItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link to={item.href}>
                          <Clock className="size-3.5" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
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
          {/* Breadcrumb navigation — H.2.3 */}
          <Breadcrumbs
            appName={appName}
            appId={appId ?? ''}
            objectName={breadcrumbObjectName}
            recordTitle={breadcrumbRecordTitle}
          />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
