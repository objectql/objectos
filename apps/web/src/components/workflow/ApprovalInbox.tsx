/**
 * ApprovalInbox — centralized view for all pending approval items.
 *
 * Shows a list of records across all objects that require the current
 * user's approval action, with quick approve/reject buttons.
 *
 * Phase J — Task J.2
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ExternalLink, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkflowStatus, WorkflowTransition } from '@/types/workflow';

export interface ApprovalItem {
  id: string;
  objectName: string;
  objectLabel: string;
  recordId: string;
  recordTitle: string;
  workflowStatus: WorkflowStatus;
  submittedBy: string;
  submittedAt: string;
  /** Link to the record detail page */
  detailPath: string;
}

interface ApprovalInboxProps {
  items: ApprovalItem[];
  onApprove: (item: ApprovalItem, transition: WorkflowTransition) => void;
  isExecuting?: boolean;
}

type FilterMode = 'all' | 'pending' | 'completed';

export function ApprovalInbox({ items, onApprove, isExecuting = false }: ApprovalInboxProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('pending');

  const filteredItems = items.filter((item) => {
    if (filterMode === 'pending') {
      return item.workflowStatus.availableTransitions.length > 0;
    }
    if (filterMode === 'completed') {
      return item.workflowStatus.availableTransitions.length === 0;
    }
    return true;
  });

  const pendingCount = items.filter(
    (item) => item.workflowStatus.availableTransitions.length > 0,
  ).length;

  return (
    <Card data-testid="approval-inbox">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-muted-foreground" />
            <CardTitle>Approval Inbox</CardTitle>
            {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
          </div>
          <div className="flex gap-1">
            {(['all', 'pending', 'completed'] as FilterMode[]).map((mode) => (
              <Button
                key={mode}
                variant={filterMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setFilterMode(mode)}
              >
                <Filter className="mr-1 size-3" />
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="mb-2 size-8 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No {filterMode === 'pending' ? 'pending approvals' : 'items'} to display.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const hasActions = item.workflowStatus.availableTransitions.length > 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                  data-testid={`approval-item-${item.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.objectLabel}
                      </Badge>
                      <Link
                        to={item.detailPath}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {item.recordTitle}
                        <ExternalLink className="ml-1 inline size-3" />
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Submitted by <strong>{item.submittedBy}</strong>
                      </span>
                      <span>
                        {new Date(item.submittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.workflowStatus.currentStateLabel}
                      </Badge>
                    </div>
                  </div>

                  {hasActions && (
                    <div className="flex gap-1.5">
                      {item.workflowStatus.availableTransitions.map((transition) => {
                        const isApprove =
                          transition.name.includes('approve') ||
                          transition.name.includes('complete');
                        const isReject =
                          transition.name.includes('reject') || transition.name.includes('deny');
                        return (
                          <Button
                            key={transition.name}
                            variant={isReject ? 'destructive' : isApprove ? 'default' : 'outline'}
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => onApprove(item, transition)}
                            disabled={isExecuting}
                          >
                            {isApprove ? (
                              <CheckCircle2 className="size-3" />
                            ) : isReject ? (
                              <XCircle className="size-3" />
                            ) : null}
                            {transition.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
