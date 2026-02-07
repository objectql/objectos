import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GitBranch, FileText } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '1,234', icon: Users },
  { label: 'Active Workflows', value: '56', icon: GitBranch },
  { label: 'Documents', value: '892', icon: FileText },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const user = session.user as { id: string; name: string; email: string; role?: string };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name || 'User'}</CardTitle>
          <CardDescription>
            You are successfully authenticated. This is your organization workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User ID</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{user.id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{user.role || 'Member'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
