import { useSession } from '@/lib/auth-client';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Protects routes that require authentication.
 * Redirects to /sign-in if no active session.
 */
export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
