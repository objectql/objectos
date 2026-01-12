import { Routes, Route, Navigate } from 'react-router-dom';
import AppList from './pages/AppList';
import Login from './pages/Login';
import AppDashboard from './pages/AppDashboard'; // New App Home
import Settings from './pages/Settings';
import Organization from './pages/Organization';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { ObjectListRoute } from './pages/objects/ObjectListRoute';
import { ObjectDetailRoute } from './pages/objects/ObjectDetailRoute';
import * as paths from './routes';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  // Auth Routing
  if (!user) {
      return (
        <Routes>
            <Route path={paths.LOGIN} element={<Login />} />
            <Route path="*" element={<Navigate to={paths.LOGIN} replace />} />
        </Routes>
      );
  }

  return (
    <Routes>
        <Route path={paths.LOGIN} element={<Navigate to="/" replace />} />
        
        {/* Main App Selection Layout */}
        <Route element={<MainLayout />}>
            <Route path={paths.ROOT} element={<AppList />} />
            <Route path={paths.APPS} element={<AppList />} />
        </Route>

        {/* Workspace/Dashboard Layout */}
        <Route element={<WorkspaceLayout />}>
            {/* The App Home Dashboard showing menu shortcuts */}
            <Route path={paths.APP_ROOT} element={<AppDashboard />} />
            
            {/* Object Routes */}
            <Route path={paths.APP_OBJECT_LIST} element={<ObjectListRoute isCreating={false} />} />
            <Route path={paths.APP_OBJECT_NEW} element={<ObjectListRoute isCreating={true} />} />
            <Route path={paths.APP_OBJECT_DETAIL} element={<ObjectDetailRoute />} />
            {/* Legacy/Compat routes support */}
            <Route path="/app/:appName/object/:objectName/:recordId" element={<ObjectDetailRoute />} />
            
            {/* Global/Standard Routes */}
            <Route path={paths.SETTINGS} element={<Settings />} />
            <Route path={paths.ORGANIZATION} element={<Organization />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

