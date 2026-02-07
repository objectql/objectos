import { useSession } from '@/lib/auth-client';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protects routes that require authentication.
 * Redirects to /sign-in if no active session.
 */
export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
