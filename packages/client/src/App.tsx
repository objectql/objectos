import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  // Simple routing
  if (!user && currentPath !== '/login') {
      window.history.pushState({}, '', '/login');
      // Update state to match new URL to prevent inconsistent state
      if (currentPath !== '/login') {
        setCurrentPath('/login');
      }
      return <Login />;
  }

  if (currentPath === '/login') {
      if (user) {
          window.history.pushState({}, '', '/dashboard');
          return <Dashboard />;
      }
      return <Login />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
