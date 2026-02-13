import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Package Management</h2>
        <p className="text-muted-foreground">
          Install, enable, and manage ObjectOS plugins and app packages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Installed Packages</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>View active packages, versions, and health status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Check Updates</Button>
          <Button variant="outline">Disable Package</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Registry</CardTitle>
            <Badge variant="secondary">Scaffold</Badge>
          </div>
          <CardDescription>Discover and install packages from the registry.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Browse Registry</Button>
          <Button variant="outline">Install from URL</Button>
        </CardContent>
      </Card>
    </div>
  );
}
