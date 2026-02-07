import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organization Management</h2>
        <p className="text-muted-foreground">
          Admin tools for tenants, domains, and organization lifecycle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Organization Directory</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            Search, create, and suspend organizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Create Organization</Button>
          <Button variant="outline">Suspend</Button>
          <Button variant="outline">Transfer Ownership</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Domain and SSO</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>
            Configure verified domains and enforce SSO policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Verify Domain</Button>
          <Button variant="outline">Require SSO</Button>
        </CardContent>
      </Card>
    </div>
  );
}
