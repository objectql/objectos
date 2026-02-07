import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminPermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permissions and RBAC</h2>
        <p className="text-muted-foreground">
          Manage roles, permission sets, and object-level policies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Roles</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            Define high-level access roles and assign them to users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Create Role</Button>
          <Button variant="outline">Assign Members</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Permission Sets</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            Granular permissions for objects, fields, and records.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">New Permission Set</Button>
          <Button variant="outline">Import YAML</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Policy Preview</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            Simulate access for a user or role before rollout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Run Preview</Button>
        </CardContent>
      </Card>
    </div>
  );
}
