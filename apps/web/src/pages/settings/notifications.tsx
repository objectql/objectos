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

interface NotificationChannel {
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
}

interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

const channelTypeColors: Record<string, string> = {
  email: 'default',
  sms: 'secondary',
  push: 'outline',
  webhook: 'outline',
};

export default function NotificationsPage() {
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['notifications', 'channels'],
    queryFn: async () => {
      const response = await fetch('/api/v1/notifications/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
  });

  const { data: queueData } = useQuery({
    queryKey: ['notifications', 'queue'],
    queryFn: async () => {
      const response = await fetch('/api/v1/notifications/queue/status');
      if (!response.ok) throw new Error('Failed to fetch queue status');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const channels: NotificationChannel[] = channelsData?.data || [];
  const queueStatus: QueueStatus | undefined = queueData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Notification Settings</h2>
        <p className="text-muted-foreground">
          Manage notification channels, templates, and delivery settings.
        </p>
      </div>

      {/* Queue Status */}
      {queueStatus && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">{queueStatus.pending || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
              <CardTitle className="text-3xl">{queueStatus.processing || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">
                {queueStatus.completed || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-destructive">{queueStatus.failed || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Configure and manage notification delivery channels</CardDescription>
        </CardHeader>
        <CardContent>
          {channelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notification channels configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Configuration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{channel.name}</TableCell>
                    <TableCell>
                      <Badge variant={channelTypeColors[channel.type] as any}>{channel.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {channel.enabled ? (
                        <Badge variant="outline">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {Object.entries(channel.config)
                        .filter(([_, value]) => value && value !== 'not configured')
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Channel Details */}
      {channels.find((c) => c.type === 'email') && (
        <Card>
          <CardHeader>
            <CardTitle>Email Channel</CardTitle>
            <CardDescription>SMTP configuration and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">From Address:</span>{' '}
                {channels.find((c) => c.type === 'email')?.config.from || 'Not configured'}
              </div>
              <div>
                <span className="font-medium">SMTP Server:</span>{' '}
                {channels.find((c) => c.type === 'email')?.config.host || 'Not configured'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMS Channel Details */}
      {channels.find((c) => c.type === 'sms') && (
        <Card>
          <CardHeader>
            <CardTitle>SMS Channel</CardTitle>
            <CardDescription>SMS provider configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Provider:</span>{' '}
                {channels.find((c) => c.type === 'sms')?.config.provider || 'Not configured'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push Channel Details */}
      {channels.find((c) => c.type === 'push') && (
        <Card>
          <CardHeader>
            <CardTitle>Push Channel</CardTitle>
            <CardDescription>Push notification provider configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Provider:</span>{' '}
                {channels.find((c) => c.type === 'push')?.config.provider || 'Not configured'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Channel Details */}
      {channels.find((c) => c.type === 'webhook') && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Channel</CardTitle>
            <CardDescription>Webhook delivery settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Webhook channel is available for sending HTTP POST notifications
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Manage notification templates (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Template management will be available in a future update
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
