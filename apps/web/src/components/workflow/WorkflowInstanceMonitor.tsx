/**
 * WorkflowInstanceMonitor — real-time workflow execution tracking.
 *
 * Shows a list of active workflow instances with their current state,
 * progress, and execution history. Supports filtering by status and object.
 *
 * Phase J — Task J.4
 */

import { useState } from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface WorkflowInstance {
  id: string;
  workflowName: string;
  workflowLabel: string;
  objectName: string;
  recordId: string;
  recordTitle: string;
  currentState: string;
  currentStateLabel: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  /** Percentage of states completed */
  progress: number;
  /** User who initiated the workflow */
  initiatedBy: string;
}

interface WorkflowInstanceMonitorProps {
  instances: WorkflowInstance[];
  onRetry?: (instanceId: string) => void;
  onPause?: (instanceId: string) => void;
}

type StatusFilter = 'all' | 'running' | 'completed' | 'failed' | 'paused';

const statusIcons = {
  running: Activity,
  completed: CheckCircle2,
  failed: AlertCircle,
  paused: Pause,
};

const statusColors = {
  running: 'text-blue-600',
  completed: 'text-green-600',
  failed: 'text-red-600',
  paused: 'text-yellow-600',
};

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  paused: 'outline',
};

export function WorkflowInstanceMonitor({
  instances,
  onRetry,
  onPause,
}: WorkflowInstanceMonitorProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredInstances =
    statusFilter === 'all' ? instances : instances.filter((i) => i.status === statusFilter);

  const counts = {
    all: instances.length,
    running: instances.filter((i) => i.status === 'running').length,
    completed: instances.filter((i) => i.status === 'completed').length,
    failed: instances.filter((i) => i.status === 'failed').length,
    paused: instances.filter((i) => i.status === 'paused').length,
  };

  return (
    <Card data-testid="workflow-instance-monitor">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-muted-foreground" />
            <CardTitle>Workflow Instances</CardTitle>
          </div>
          <div className="flex gap-1">
            {(['all', 'running', 'completed', 'failed', 'paused'] as StatusFilter[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1 text-xs capitalize"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                  {counts[status] > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 size-4 justify-center rounded-full p-0 text-[10px]"
                    >
                      {counts[status]}
                    </Badge>
                  )}
                </Button>
              ),
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInstances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="mb-2 size-8 text-muted-foreground" />
            <p className="text-lg font-medium">No workflow instances</p>
            <p className="text-sm text-muted-foreground">
              Workflow instances will appear here when workflows are executed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInstances.map((instance) => {
              const StatusIcon = statusIcons[instance.status];
              return (
                <div
                  key={instance.id}
                  className="rounded-lg border p-3"
                  data-testid={`workflow-instance-${instance.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`size-4 ${statusColors[instance.status]}`} />
                      <span className="font-medium">{instance.workflowLabel}</span>
                      <Badge
                        variant={statusBadgeVariants[instance.status]}
                        className="text-xs capitalize"
                      >
                        {instance.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {instance.status === 'failed' && onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => onRetry(instance.id)}
                        >
                          Retry
                        </Button>
                      )}
                      {instance.status === 'running' && onPause && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => onPause(instance.id)}
                        >
                          Pause
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Record: <strong>{instance.recordTitle}</strong>
                    </span>
                    <span>
                      State: <strong>{instance.currentStateLabel}</strong>
                    </span>
                    <span>By: {instance.initiatedBy}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(instance.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          instance.status === 'failed'
                            ? 'bg-red-500'
                            : instance.status === 'completed'
                              ? 'bg-green-500'
                              : instance.status === 'paused'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                        }`}
                        style={{ width: `${instance.progress}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                      {instance.progress}% complete
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
