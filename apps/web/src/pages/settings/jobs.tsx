import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'scheduled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount?: number;
  data?: any;
}

interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  scheduled: number;
}

const statusColors: Record<string, string> = {
  pending: 'secondary',
  running: 'default',
  completed: 'outline',
  failed: 'destructive',
  cancelled: 'secondary',
  scheduled: 'secondary',
};

const priorityColors: Record<string, string> = {
  low: 'secondary',
  normal: 'outline',
  high: 'default',
  critical: 'destructive',
};

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`/api/v1/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  // Fetch job stats
  const { data: statsData } = useQuery({
    queryKey: ['jobs', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/jobs/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Retry job mutation
  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/v1/jobs/${jobId}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry job');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel job');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const jobs: Job[] = jobsData?.data || [];
  const stats: JobStats | undefined = statsData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Jobs Monitor</h2>
        <p className="text-muted-foreground">
          Monitor and manage background jobs, queue status, and retry failed tasks.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Running</CardDescription>
              <CardTitle className="text-3xl">{stats.running}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-destructive">{stats.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Queue</CardTitle>
              <CardDescription>View and manage background jobs</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[job.status] as any}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColors[job.priority] as any}>
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{job.retryCount || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate(job.id)}
                            disabled={retryMutation.isPending}
                          >
                            Retry
                          </Button>
                        )}
                        {(job.status === 'pending' || job.status === 'scheduled') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelMutation.mutate(job.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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
