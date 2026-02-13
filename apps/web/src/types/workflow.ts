/**
 * Workflow & Automation type definitions for ObjectOS.
 *
 * These types drive the Workflow Status Badges, Approval Actions,
 * Workflow Visualizer, Automation Rules Builder, and Activity Timeline
 * components in the Business App Shell.
 */

// ── Workflow Types ──────────────────────────────────────────────

export interface WorkflowState {
  name: string;
  label: string;
  initial?: boolean;
  final?: boolean;
  color?: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface WorkflowTransition {
  name: string;
  label: string;
  from: string;
  to: string;
  /** Permission guard required to execute this transition */
  guard?: string;
  /** Actions triggered when transition executes */
  actions?: string[];
}

export interface WorkflowDefinition {
  name: string;
  label: string;
  /** The object this workflow is attached to */
  object: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  /** Field on the record that holds the current state */
  stateField?: string;
}

/** Current workflow status of a specific record */
export interface WorkflowStatus {
  workflowName: string;
  currentState: string;
  currentStateLabel: string;
  color: WorkflowState['color'];
  availableTransitions: WorkflowTransition[];
  /** Whether the current user can approve/reject */
  canApprove?: boolean;
}

// ── Automation Types ────────────────────────────────────────────

export type AutomationTriggerType =
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'field_changed'
  | 'workflow_transition'
  | 'schedule'
  | 'manual';

export type AutomationActionType =
  | 'update_record'
  | 'create_record'
  | 'send_email'
  | 'send_notification'
  | 'call_webhook'
  | 'run_workflow'
  | 'assign_record';

export interface AutomationCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty';
  value: string;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  object?: string;
  field?: string;
  /** Cron expression for schedule triggers */
  schedule?: string;
}

export interface AutomationAction {
  type: AutomationActionType;
  label: string;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  object: string;
  active: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

// ── Activity Types ──────────────────────────────────────────────

export type ActivityType =
  | 'record_created'
  | 'record_updated'
  | 'field_changed'
  | 'workflow_transition'
  | 'approval'
  | 'comment'
  | 'attachment'
  | 'email_sent';

export interface ActivityFieldChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  user: string;
  userAvatar?: string;
  /** Human-readable summary */
  summary: string;
  /** Detail payload varies by type */
  changes?: ActivityFieldChange[];
  /** Workflow transition details */
  fromState?: string;
  toState?: string;
  /** Comment body */
  comment?: string;
}

// ── View Types ──────────────────────────────────────────────────

export type ViewMode = 'table' | 'kanban' | 'calendar';

export interface KanbanColumn {
  value: string;
  label: string;
  color?: string;
}

// ── Layout Types ────────────────────────────────────────────────

export type LayoutSectionType = 'fields' | 'related' | 'activity' | 'chart';

export interface LayoutSection {
  id: string;
  type: LayoutSectionType;
  title: string;
  columns?: number;
  fields?: string[];
  collapsed?: boolean;
}

export interface PageLayout {
  name: string;
  object: string;
  sections: LayoutSection[];
}

// ── Chart Types ─────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'number';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  description?: string;
  data: ChartDataPoint[];
  /** Field used for grouping / x-axis */
  groupField?: string;
  /** Field used for values / y-axis */
  valueField?: string;
}
