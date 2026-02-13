/**
 * EmptyState — reusable empty state component.
 *
 * Provides a consistent empty state pattern with icon, title,
 * description, and optional action button.
 *
 * Phase L — Task L.5
 */

import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Icon to display (defaults to Inbox) */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Custom CSS class */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed py-12 ${className ?? ''}`}
      data-testid="empty-state"
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox className="size-6 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
