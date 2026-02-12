/**
 * TriggerMonitorDashboard — automation execution logs and statistics.
 *
 * Shows a dashboard of recent automation trigger executions with
 * success/failure rates, execution times, and detailed logs.
 *
 * Phase J — Task J.5
 */

import { useState } from 'react';
import { Zap, CheckCircle2, XCircle, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TriggerExecution {
  id: string;
  ruleName: string;
  ruleId: string;
  objectName: string;
  recordId: string;
  triggerType: string;
  status: 'success' | 'failure' | 'skipped';
  executionTime: number; // milliseconds
  executedAt: string;
  error?: string;
  actionsExecuted: number;
  actionsFailed: number;
}

interface TriggerMonitorDashboardProps {
  executions: TriggerExecution[];
  /** Time range for statistics */
  timeRange?: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '1h' | '24h' | '7d' | '30d') => void;
}

type StatusFilter = 'all' | 'success' | 'failure' | 'skipped';

export function TriggerMonitorDashboard({
  executions,
  timeRange = '24h',
  onTimeRangeChange,
}: TriggerMonitorDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredExecutions =
    statusFilter === 'all'
      ? executions
      : executions.filter((e) => e.status === statusFilter);

  // Statistics
  const totalCount = executions.length;
  const successCount = executions.filter((e) => e.status === 'success').length;
  const failureCount = executions.filter((e) => e.status === 'failure').length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;
  const avgExecTime =
    totalCount > 0
      ? Math.round(
          executions.reduce((sum, e) => sum + e.executionTime, 0) / totalCount,
        )
      : 0;

  return (
    <div className="space-y-6" data-testid="trigger-monitor-dashboard">
      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Success Rate</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Failures</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">{failureCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Time</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{avgExecTime}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Execution log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-muted-foreground" />
              <CardTitle>Execution Log</CardTitle>
            </div>
            <div className="flex gap-1">
              {onTimeRangeChange && (
                <div className="mr-3 flex gap-1">
                  {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'secondary' : 'ghost'}
                      size="sm"
                      className="text-xs"
                      onClick={() => onTimeRangeChange(range)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              )}
              {(['all', 'success', 'failure', 'skipped'] as StatusFilter[]).map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ),
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="mb-2 size-8 text-muted-foreground" />
              <p className="text-lg font-medium">No executions</p>
              <p className="text-sm text-muted-foreground">
                Trigger executions will appear here as automations run.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                  data-testid={`execution-${execution.id}`}
                >
                  {execution.status === 'success' ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                  ) : execution.status === 'failure' ? (
                    <XCircle className="size-4 shrink-0 text-red-600" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-yellow-600" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{execution.ruleName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {execution.objectName}
                      </Badge>
                    </div>
                    {execution.error && (
                      <p className="mt-0.5 text-xs text-red-600">{execution.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{execution.actionsExecuted} actions</span>
                    <span>{execution.executionTime}ms</span>
                    <span>
                      {new Date(execution.executedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
