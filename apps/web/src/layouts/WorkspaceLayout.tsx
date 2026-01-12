import { useState, useEffect, useRef } from 'react';
import { 
    SidebarProvider, 
    SidebarInset, 
    SidebarTrigger, 
    Separator, 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbList, 
    BreadcrumbPage 
} from '@objectos/ui';
import { AppSidebar } from '../components/app-sidebar';
import { Outlet, useLocation, useParams } from 'react-router-dom';

export function WorkspaceLayout() {
    const location = useLocation();
    const params = useParams();
    const [currentAppMetadata, setCurrentAppMetadata] = useState<any>(null);
    const lastFetchedApp = useRef<string | null>(null);

    // Determines current app from URL parameters or path parsing
    // Since this layout wraps routes like /app/:appName/*, we can try to extract it from location if useParams isn't populated yet by the parent?
    // Actually, in clustered routes, useParams matches the current route match.
    // If the Route is <Route path="app/:appName" element={<WorkspaceLayout />}>, then params.appName works.
    // But if we use nested routes, we might need to parse.
    
    // Simplest: Check path parts
    const appName = location.pathname.split('/')[2];
    const isAppRoute = location.pathname.startsWith('/app/');

    useEffect(() => {
        if (isAppRoute && appName) {
            // Avoid re-fetching if we already have this app loaded
            if (lastFetchedApp.current === appName) {
                return;
            }
            
            lastFetchedApp.current = appName;
            
            fetch(`/api/metadata/app/${appName}`)
                .then(res => {
                    if (!res.ok) throw new Error('App not found');
                    return res.json();
                })
                .then(data => {
                    setCurrentAppMetadata(data);
                })
                .catch(err => {
                    console.error(err);
                    setCurrentAppMetadata(null);
                    lastFetchedApp.current = null;
                });
        } else {
            if (lastFetchedApp.current) {
                setCurrentAppMetadata(null);
                lastFetchedApp.current = null;
            }
        }
    }, [isAppRoute, appName]);

    const getPageTitle = () => {
        if (location.pathname === '/settings') return 'Settings';
        if (location.pathname === '/organization') return 'Organization';
        if (appName) return `App: ${appName}`;
        return 'Dashboard';
    };

    return (
        <SidebarProvider>
            <AppSidebar objects={{}} appMetadata={currentAppMetadata} />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {getPageTitle()}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
