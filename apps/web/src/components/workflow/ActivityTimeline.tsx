/**
 * ActivityTimeline — audit log / activity feed on records.
 *
 * Shows a chronological feed of all changes, transitions, comments,
 * and system events associated with a record.
 */

import {
  FileText,
  GitBranch,
  MessageSquare,
  Mail,
  Pencil,
  Plus,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityEntry, ActivityType } from '@/types/workflow';

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  /** Maximum items to display; shows "show more" if exceeded */
  maxItems?: number;
}

const iconMap: Record<ActivityType, typeof FileText> = {
  record_created: Plus,
  record_updated: Pencil,
  field_changed: Pencil,
  workflow_transition: GitBranch,
  approval: CheckCircle2,
  comment: MessageSquare,
  attachment: Paperclip,
  email_sent: Mail,
};

const colorMap: Record<ActivityType, string> = {
  record_created: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  record_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  field_changed: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  workflow_transition: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  approval: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  comment: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  attachment: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  email_sent: 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300',
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ActivityTimeline({ activities, maxItems }: ActivityTimelineProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const hasMore = maxItems ? activities.length > maxItems : false;

  if (activities.length === 0) {
    return (
      <Card data-testid="activity-timeline">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="activity-timeline">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {displayActivities.map((entry, idx) => {
            const Icon = iconMap[entry.type] ?? FileText;
            const colors = colorMap[entry.type] ?? colorMap.record_updated;
            const isLast = idx === displayActivities.length - 1;

            return (
              <div key={entry.id} className="relative flex gap-3 pb-4">
                {/* Vertical line */}
                {!isLast && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />}

                {/* Icon */}
                <div
                  className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full ${colors}`}
                >
                  <Icon className="size-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-medium">{entry.user}</span>{' '}
                      <span className="text-muted-foreground">{entry.summary}</span>
                    </p>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={entry.timestamp}
                      title={new Date(entry.timestamp).toLocaleString()}
                    >
                      {formatRelativeTime(entry.timestamp)}
                    </time>
                  </div>

                  {/* Field changes */}
                  {entry.changes && entry.changes.length > 0 && (
                    <div className="rounded-md bg-muted/50 p-2 text-xs">
                      {entry.changes.map((change) => (
                        <div key={change.field} className="flex items-center gap-1">
                          <span className="font-medium">{change.fieldLabel}:</span>
                          <span className="text-muted-foreground line-through">
                            {String(change.oldValue ?? '—')}
                          </span>
                          <span>→</span>
                          <span>{String(change.newValue)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workflow transition */}
                  {entry.fromState && entry.toState && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{entry.fromState}</span>
                      <span>→</span>
                      <span className="font-medium">{entry.toState}</span>
                    </div>
                  )}

                  {/* Comment */}
                  {entry.comment && (
                    <div className="rounded-md border bg-background p-2 text-sm">
                      {entry.comment}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {hasMore && (
            <p className="pl-10 text-xs text-muted-foreground">
              +{activities.length - displayActivities.length} more activities
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
