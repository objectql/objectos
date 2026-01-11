import { useState, useEffect, useRef } from 'react';
import AppList from './pages/AppList';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Organization from './pages/Organization';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSidebar } from './components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger, Separator, Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem } from '@objectos/ui';
import { LogOut, Settings as SettingsIcon, Building, Bell } from 'lucide-react';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const [currentAppMetadata, setCurrentAppMetadata] = useState<any>(null);
  const lastFetchedApp = useRef<string | null>(null);

  // Fetch App Metadata when entering an app
  useEffect(() => {
    const parts = currentPath.split('/');
    if (parts[1] === 'app' && parts[2]) {
        const appName = parts[2];
        
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
                // Ensure ref matches confirmed loaded data ID/Name if needed, but keeping it simple
            })
            .catch(err => {
                console.error(err);
                setCurrentAppMetadata(null);
                // Reset ref on error so we can try again if user refreshes or navs away and back
                lastFetchedApp.current = null;
            });
    } else {
        if (lastFetchedApp.current) {
            setCurrentAppMetadata(null);
            lastFetchedApp.current = null;
        }
    }
  }, [currentPath]); // Remove currentAppMetadata from dependency

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    // Custom event for navigation
    const handlePushState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('pushstate', handlePushState);
    
    return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('pushstate', handlePushState);
    };
  }, []);

  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  // Auth Routing
  if (!user) {
      if (currentPath !== '/login') {
          window.history.pushState({}, '', '/login');
          return <Login />;
      }
      return <Login />;
  }

  if (currentPath === '/login') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
  }

  // Main Layout
  if (currentPath === '/' || currentPath === '/apps') {
      return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <header className="flex h-16 shrink-0 items-center gap-4 border-b px-6 bg-card sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span>ObjectOS</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 outline-none">
                                <Avatar className="h-8 w-8 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={user?.image} alt={user?.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                            <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.image} alt={user?.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user?.name}</span>
                                <span className="truncate text-xs">{user?.email}</span>
                                </div>
                            </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Building className="mr-2 h-4 w-4" />
                                    Organization
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                     <h1 className="text-2xl font-bold mb-6">Apps</h1>
                     <AppList />
                </div>
            </div>
        </div>
      );
  }

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
                                {(() => {
                                    if (currentPath === '/settings') return 'Settings';
                                    if (currentPath === '/organization') return 'Organization';
                                    
                                    const parts = currentPath.split('/');
                                    if (parts[1] === 'app') {
                                        return `App: ${parts[2]}`;
                                    }
                                    return 'Dashboard';
                                })()}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
                {currentPath === '/settings' ? <Settings /> : 
                 currentPath === '/organization' ? <Organization /> : <Dashboard />}
            </div>
          </SidebarInset>
      </SidebarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

