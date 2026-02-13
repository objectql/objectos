/**
 * WorkflowStatusBadge — shows current workflow state on records.
 *
 * Renders a colored badge indicating the current workflow state of a record.
 * Optionally shows available transitions as a tooltip.
 */

import { Badge } from '@/components/ui/badge';
import type { WorkflowStatus, WorkflowState } from '@/types/workflow';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  /** Show the workflow name alongside the state */
  showWorkflowName?: boolean;
}

const colorMap: Record<NonNullable<WorkflowState['color']>, string> = {
  default: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function WorkflowStatusBadge({
  status,
  showWorkflowName = false,
}: WorkflowStatusBadgeProps) {
  const colorClasses = colorMap[status.color ?? 'default'];

  return (
    <div className="inline-flex items-center gap-1.5" data-testid="workflow-status-badge">
      {showWorkflowName && (
        <span className="text-xs text-muted-foreground">{status.workflowName}:</span>
      )}
      <Badge variant="outline" className={`border-0 ${colorClasses}`}>
        {status.currentStateLabel}
      </Badge>
    </div>
  );
}
