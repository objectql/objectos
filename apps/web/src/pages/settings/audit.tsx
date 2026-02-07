import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">
          Track all system events, mutations, and access history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Event Log</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            A chronological stream of CRUD events, field-level changes, and login activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect to <code>@objectos/audit</code> API to display events here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
