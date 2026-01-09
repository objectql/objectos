import { useState, useEffect } from 'react';
import AppList from './pages/AppList';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Organization from './pages/Organization';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSidebar } from './components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger, Separator, Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@objectql/ui';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  // This would ideally come from a context or prop passed from Dashboard, 
  // but for now we'll fetch objects to pass to Sidebar in AppContent as well if needed, 
  // or refactor layout. 
  // ACTUALLY: Dashboard handles the Sidebar usually. 
  // Let's modify AppContent to render the Main Layout if logged in.
  
  const [objects, setObjects] = useState<Record<string, any>>({});
  const [currentAppMetadata, setCurrentAppMetadata] = useState<any>(null);

  // Fetch App Metadata when entering an app
  useEffect(() => {
      const parts = currentPath.split('/');
      if (parts[1] === 'app' && parts[2]) {
          const appName = parts[2];
          // Simple cache check/avoid refetch if same app
          if (currentAppMetadata && (currentAppMetadata.id === appName || currentAppMetadata.content?.code === appName)) {
              return;
          }
          
          fetch(`/api/v6/metadata/app/${appName}`)
              .then(res => {
                  if (!res.ok) throw new Error('App not found');
                  return res.json();
              })
              .then(data => setCurrentAppMetadata(data))
              .catch(err => {
                  console.error(err);
                  setCurrentAppMetadata(null);
              });
      } else if (currentAppMetadata) {
          setCurrentAppMetadata(null);
      }
  }, [currentPath, currentAppMetadata]);
  
  // We need to fetch objects for the sidebar if we are not in dashboard
  useEffect(() => {
    if (user && Object.keys(objects).length === 0) {
        fetch('/api/v6/metadata/object')
            .then(res => res.json())
            .then(result => {
                const objectsMap: Record<string, any> = {};
                if (Array.isArray(result)) {
                    result.forEach((obj: any) => {
                        objectsMap[obj.name] = obj;
                    });
                }
                setObjects(objectsMap);
            })
            .catch(console.error);
    }
  }, [user]);

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
        <SidebarProvider>
            <AppSidebar objects={objects} />
            <SidebarInset>
                 <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Apps</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
                    <AppList />
                </div>
            </SidebarInset>
        </SidebarProvider>
      );
  }

  return (
      <SidebarProvider>
          <AppSidebar objects={objects} appMetadata={currentAppMetadata} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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

