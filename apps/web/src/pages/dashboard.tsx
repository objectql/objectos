import { Link } from 'react-router-dom';
import { useSession, useActiveOrganization, useListOrganizations } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Building2,
  Users,
  Mail,
  Shield,
  Settings,
  Plus,
  ArrowRight,
  UsersRound,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const activeOrg = useActiveOrganization();
  const orgs = useListOrganizations();

  if (!session?.user) return null;

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role?: string;
    twoFactorEnabled?: boolean;
    createdAt?: string | Date;
  };

  const org = activeOrg.data as {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    members?: { id: string; role: string; user: { name: string; email: string } }[];
    invitations?: { id: string; status: string }[];
  } | null;

  const orgList = (orgs.data ?? []) as { id: string; name: string }[];
  const members = org?.members ?? [];
  const pendingInvitations = (org?.invitations ?? []).filter(
    (inv) => inv.status === 'pending',
  );

  const quickLinks = [
    { label: 'Members', href: '/organization/members', icon: Users, count: members.length },
    { label: 'Teams', href: '/organization/teams', icon: UsersRound },
    { label: 'Invitations', href: '/organization/invitations', icon: Mail, count: pendingInvitations.length },
    { label: 'Org Settings', href: '/organization/settings', icon: Building2 },
    { label: 'Account', href: '/settings/account', icon: Settings },
    { label: 'Security', href: '/settings/security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name || 'User'}
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your workspace.
        </p>
      </div>

      {/* Profile + Org Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-lg">
                <AvatarFallback className="rounded-lg text-lg">
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name || 'Unnamed'}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge variant="secondary">{user.role || 'user'}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Two-Factor Auth:</span>
              {user.twoFactorEnabled ? (
                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Disabled</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/settings/account">Edit Profile</Link>
              </Button>
              {!user.twoFactorEnabled && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings/security">Enable 2FA</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Organization</CardTitle>
              {orgList.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {orgList.length} {orgList.length === 1 ? 'org' : 'orgs'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {org ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{org.name}</p>
                    <p className="text-sm text-muted-foreground truncate">/{org.slug}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" />
                    <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" />
                    <span>{pendingInvitations.length} pending</span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/organization/members">
                    Manage Organization
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <Building2 className="size-10 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">No organization selected</p>
                  <p className="text-sm text-muted-foreground">
                    Create or join an organization to collaborate.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/organization/create">
                    <Plus className="size-4" />
                    Create Organization
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Links</CardTitle>
          <CardDescription>Jump to common tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickLinks.map(({ label, href, icon: Icon, count }) => (
              <Button
                key={label}
                asChild
                variant="outline"
                className="h-auto flex-col gap-1 py-3 relative"
              >
                <Link to={href}>
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="text-xs">{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                      {count}
                    </span>
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
