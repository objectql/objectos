/**
 * ApprovalActions — approve/reject action buttons for pending records.
 *
 * Renders transition buttons for records in an approval workflow state.
 * Buttons are styled based on transition semantics (approve → green, reject → red).
 */

import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkflowStatus, WorkflowTransition } from '@/types/workflow';

interface ApprovalActionsProps {
  status: WorkflowStatus;
  onTransition: (transition: WorkflowTransition) => void;
  /** Whether a transition is currently being executed */
  isExecuting?: boolean;
}

function getTransitionVariant(name: string): 'default' | 'destructive' | 'outline' {
  const lower = name.toLowerCase();
  if (lower.includes('approve') || lower.includes('close_won') || lower.includes('complete') || lower.includes('mark_paid')) {
    return 'default';
  }
  if (lower.includes('reject') || lower.includes('close_lost')) {
    return 'destructive';
  }
  return 'outline';
}

function getTransitionIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('approve') || lower.includes('complete') || lower.includes('close_won') || lower.includes('mark_paid')) {
    return Check;
  }
  if (lower.includes('reject') || lower.includes('close_lost')) {
    return X;
  }
  return ArrowRight;
}

export function ApprovalActions({ status, onTransition, isExecuting = false }: ApprovalActionsProps) {
  const transitions = status.availableTransitions;

  if (transitions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="approval-actions">
      {transitions.map((transition) => {
        const variant = getTransitionVariant(transition.name);
        const Icon = getTransitionIcon(transition.name);
        return (
          <Button
            key={transition.name}
            variant={variant}
            size="sm"
            className="gap-1.5"
            onClick={() => onTransition(transition)}
            disabled={isExecuting}
          >
            <Icon className="size-3.5" />
            {transition.label}
          </Button>
        );
      })}
    </div>
  );
}
