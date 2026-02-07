import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GitBranch, FileText } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-500' },
  { label: 'Active Workflows', value: '56', icon: GitBranch, color: 'text-green-500' },
  { label: 'Documents', value: '892', icon: FileText, color: 'text-purple-500' },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const user = session.user as { id: string; name: string; email: string; role?: string };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-muted p-3">
                <Icon className={`size-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome, {user.name || 'User'}</CardTitle>
          <CardDescription>
            You are successfully authenticated. This is your organization workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Current Session</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">User ID</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{user.id}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">Role</span>
                <Badge variant="secondary">{user.role || 'Member'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
