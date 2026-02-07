import { Link } from 'react-router-dom';
import { useSession, useActiveOrganization, useListOrganizations } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Shield,
  Package,
  ArrowRight,
} from 'lucide-react';

export default function SettingsOverviewPage() {
  const { data: session } = useSession();
  const activeOrg = useActiveOrganization();
  const orgs = useListOrganizations();

  if (!session?.user) return null;

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role?: string;
  };

  const org = activeOrg.data as {
    id: string;
    name: string;
    slug: string;
    members?: { id: string }[];
  } | null;

  const orgList = (orgs.data ?? []) as { id: string }[];

  const cards = [
    {
      title: 'Organization',
      description: org
        ? `${org.name} — ${org.members?.length ?? 0} members`
        : 'Create or select an organization.',
      href: '/settings/organization',
      icon: Building2,
    },
    {
      title: 'Members & Teams',
      description: 'Manage members, roles, invitations, and teams.',
      href: '/settings/members',
      icon: Users,
    },
    {
      title: 'Permissions',
      description: 'RBAC roles, permission sets, and access policies.',
      href: '/settings/permissions',
      icon: Shield,
    },
    {
      title: 'Packages',
      description: 'Install, enable, and manage business app packages.',
      href: '/settings/packages',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Welcome back, {user.name || 'Admin'}. Manage your platform from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <card.icon className="size-5 text-muted-foreground" />
                  {card.title}
                </CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link to={card.href}>
                  Manage
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary">
            {orgList.length} {orgList.length === 1 ? 'organization' : 'organizations'}
          </Badge>
          <Badge variant="secondary">Role: {user.role || 'user'}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
