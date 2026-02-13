import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditEvent {
  id: string;
  eventType: string;
  objectName: string;
  recordId?: string;
  userId?: string;
  timestamp: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: Record<string, any>;
}

const eventTypeColors: Record<string, string> = {
  'data.create': 'default',
  'data.update': 'secondary',
  'data.delete': 'destructive',
  'data.find': 'outline',
  'job.enqueued': 'secondary',
  'job.completed': 'outline',
  'job.failed': 'destructive',
};

export default function AuditPage() {
  const [objectFilter, setObjectFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['audit', 'events', objectFilter, userFilter, eventTypeFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (objectFilter) params.append('objectName', objectFilter);
      if (userFilter) params.append('userId', userFilter);
      if (eventTypeFilter !== 'all') params.append('eventType', eventTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '100');

      const response = await fetch(`/api/v1/audit/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit events');
      return response.json();
    },
  });

  const events: AuditEvent[] = eventsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">
          Track all system events, mutations, and access history.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit events by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="object">Object Name</Label>
              <Input
                id="object"
                placeholder="e.g., accounts"
                value={objectFilter}
                onChange={(e) => setObjectFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">User ID</Label>
              <Input
                id="user"
                placeholder="Filter by user"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="data.create">Create</SelectItem>
                  <SelectItem value="data.update">Update</SelectItem>
                  <SelectItem value="data.delete">Delete</SelectItem>
                  <SelectItem value="data.find">Read</SelectItem>
                  <SelectItem value="job.enqueued">Job Enqueued</SelectItem>
                  <SelectItem value="job.completed">Job Completed</SelectItem>
                  <SelectItem value="job.failed">Job Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                Showing {events.length} event{events.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit events found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={(eventTypeColors[event.eventType] as any) || 'secondary'}>
                        {event.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{event.objectName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.recordId || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.userId || 'System'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.changes && event.changes.length > 0 ? (
                        <div className="space-y-1">
                          {event.changes.slice(0, 2).map((change, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{change.field}:</span>{' '}
                              {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                            </div>
                          ))}
                          {event.changes.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{event.changes.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
