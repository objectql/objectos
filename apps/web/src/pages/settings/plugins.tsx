import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Plugin {
  name: string;
  version: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  uptime: number;
  health: {
    status: string;
    uptime: number;
    checks?: Array<{
      name: string;
      status: string;
      message: string;
    }>;
  };
  manifest: {
    capabilities?: {
      services?: string[];
      emits?: string[];
      listens?: string[];
      routes?: string[];
    };
    security?: {
      requiredPermissions?: string[];
      handlesSensitiveData?: boolean;
      makesExternalCalls?: boolean;
    };
  };
}

const statusColors: Record<string, string> = {
  healthy: 'outline',
  degraded: 'default',
  error: 'destructive',
  unknown: 'secondary',
};

export default function PluginsPage() {
  const { data: pluginsData, isLoading } = useQuery({
    queryKey: ['admin', 'plugins'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/plugins');
      if (!response.ok) throw new Error('Failed to fetch plugins');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const plugins: Plugin[] = pluginsData?.data || [];

  function formatUptime(ms: number) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Plugin Management</h2>
        <p className="text-muted-foreground">
          View loaded plugins, health status, and capabilities.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">No plugins loaded</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plugin Summary</CardTitle>
              <CardDescription>
                {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} loaded
                {' • '}
                {plugins.filter((p) => p.status === 'healthy').length} healthy
                {plugins.filter((p) => p.status === 'degraded').length > 0 &&
                  ` • ${plugins.filter((p) => p.status === 'degraded').length} degraded`}
                {plugins.filter((p) => p.status === 'error').length > 0 &&
                  ` • ${plugins.filter((p) => p.status === 'error').length} error`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Plugins Table */}
          <Card>
            <CardHeader>
              <CardTitle>Loaded Plugins</CardTitle>
              <CardDescription>Status and metadata for each plugin</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plugin</TableHead>
                    <TableHead className="hidden sm:table-cell">Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Uptime</TableHead>
                    <TableHead className="hidden lg:table-cell">Services</TableHead>
                    <TableHead className="hidden md:table-cell">Security</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => (
                    <TableRow key={plugin.name}>
                      <TableCell className="font-medium">{plugin.name}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {plugin.version}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[plugin.status] as any}>{plugin.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {formatUptime(plugin.uptime)}
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {plugin.manifest?.capabilities?.services?.join(', ') || '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-1">
                          {plugin.manifest?.security?.handlesSensitiveData && (
                            <Badge variant="secondary" className="text-xs">
                              Sensitive
                            </Badge>
                          )}
                          {plugin.manifest?.security?.makesExternalCalls && (
                            <Badge variant="secondary" className="text-xs">
                              External
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed Health Checks */}
          <div className="grid gap-4 md:grid-cols-2">
            {plugins.map((plugin) => (
              <Card key={plugin.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    <Badge variant={statusColors[plugin.status] as any}>{plugin.status}</Badge>
                  </div>
                  <CardDescription>
                    v{plugin.version} • {formatUptime(plugin.uptime)} uptime
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plugin.health.checks && plugin.health.checks.length > 0 ? (
                    <div className="space-y-2">
                      {plugin.health.checks.map((check, idx) => (
                        <div key={idx} className="flex items-start justify-between text-sm">
                          <div>
                            <div className="font-medium">{check.name}</div>
                            <div className="text-muted-foreground">{check.message}</div>
                          </div>
                          <Badge variant={statusColors[check.status] as any} className="ml-2">
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No health checks available</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
