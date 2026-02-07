import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useSession, useActiveOrganization } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

/**
 * Route guard that restricts access to organization owners and admins only.
 *
 * Behavior:
 * - Loading  → spinner
 * - No active organization → redirect to create one
 * - Role is "owner" or "admin" → render child routes
 * - Otherwise → Access Denied screen
 */
export function RequireOrgAdmin() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  // ── Loading ────────────────────────────────────────────────
  if (sessionPending || orgPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── No active organization ─────────────────────────────────
  if (!activeOrg) {
    return <Navigate to="/settings/organization/create" replace />;
  }

  // ── Resolve current user's role in the active org ──────────
  const userId = session?.user?.id;
  const currentMember = activeOrg.members?.find(
    (m: { userId: string }) => m.userId === userId,
  );
  const role = currentMember?.role;
  const isAdmin = role === 'owner' || role === 'admin';

  if (isAdmin) {
    return <Outlet />;
  }

  // ── Access Denied ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
      <p className="text-muted-foreground max-w-md">
        The Admin Console is restricted to organization owners and administrators.
        Contact your organization admin if you need access.
      </p>
      <Button variant="outline" asChild>
        <a href="/console/apps/crm">Go to Apps</a>
      </Button>
    </div>
  );
}
