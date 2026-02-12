/**
 * Analytics Plugin Types for ObjectOS
 *
 * Type definitions for the analytics and reporting engine:
 * - Aggregation pipelines and stages
 * - Report definitions and results
 * - Dashboard widgets and layouts
 * - Scheduled report generation
 */

// ─── Configuration ────────────────────────────────────────────────

/**
 * Analytics plugin configuration (user-provided, all optional)
 */
export interface AnalyticsConfig {
  /** Maximum pipeline stages allowed */
  maxPipelineStages?: number;
  /** Maximum concurrent query executions */
  maxConcurrentQueries?: number;
  /** Enable result caching */
  cacheResults?: boolean;
  /** Cache time-to-live in seconds */
  cacheTTL?: number;
  /** Enable scheduled report generation */
  scheduledReportsEnabled?: boolean;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedAnalyticsConfig {
  maxPipelineStages: number;
  maxConcurrentQueries: number;
  cacheResults: boolean;
  cacheTTL: number;
  scheduledReportsEnabled: boolean;
}

// ─── Aggregation Pipeline ─────────────────────────────────────────

/**
 * Supported aggregation stage types
 */
export type AggregationStageType =
  | 'match'
  | 'group'
  | 'sort'
  | 'limit'
  | 'skip'
  | 'project'
  | 'unwind'
  | 'lookup'
  | 'addFields'
  | 'count';

/**
 * A single stage in an aggregation pipeline
 */
export interface AggregationStage {
  /** Stage type */
  type: AggregationStageType;
  /** Stage body — contents vary by type */
  body: Record<string, any>;
}

/**
 * An aggregation pipeline targeting a specific object
 */
export interface AggregationPipeline {
  /** Target object/collection name */
  objectName: string;
  /** Ordered sequence of pipeline stages */
  stages: AggregationStage[];
}

/**
 * Metadata about pipeline execution
 */
export interface AggregationMetadata {
  /** Execution time in milliseconds */
  executionTime: number;
  /** Number of records processed */
  recordsProcessed: number;
  /** Number of stages executed */
  stagesExecuted: number;
}

/**
 * Result of an aggregation pipeline execution
 */
export interface AggregationResult {
  /** Result data rows */
  data: Record<string, any>[];
  /** Execution metadata */
  metadata: AggregationMetadata;
}

// ─── Reports ──────────────────────────────────────────────────────

/**
 * Report output format
 */
export type ReportFormat = 'table' | 'chart' | 'summary';

/**
 * A parameter definition for a report
 */
export interface ReportParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'date';
  /** Whether the parameter is required */
  required?: boolean;
  /** Default value */
  defaultValue?: any;
  /** Human-readable label */
  label?: string;
}

/**
 * A report definition
 */
export interface ReportDefinition {
  /** Unique report ID */
  id: string;
  /** Human-readable report name */
  name: string;
  /** Report description */
  description?: string;
  /** Target object/collection name */
  objectName: string;
  /** Pipeline stages to execute */
  stages: AggregationStage[];
  /** Output format */
  format: ReportFormat;
  /** Dynamic parameters for the report */
  parameters?: ReportParameter[];
  /** Optional cron schedule */
  schedule?: string;
  /** Creator user ID */
  createdBy: string;
  /** ISO date of creation */
  createdAt: string;
}

/**
 * Result of a report execution
 */
export interface ReportResult {
  /** Report definition ID */
  reportId: string;
  /** Report name */
  reportName: string;
  /** Result data */
  data: Record<string, any>[];
  /** Execution metadata */
  metadata: AggregationMetadata;
  /** Parameter values used */
  parameters?: Record<string, any>;
  /** ISO date of execution */
  executedAt: string;
}

// ─── Dashboards ───────────────────────────────────────────────────

/**
 * Widget display type
 */
export type WidgetType =
  | 'metric'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'table'
  | 'list'
  | 'area_chart'
  | 'scatter_chart';

/**
 * Widget size on the dashboard grid
 */
export interface WidgetSize {
  /** Width in grid units */
  w: number;
  /** Height in grid units */
  h: number;
}

/**
 * Widget position on the dashboard grid
 */
export interface WidgetPosition {
  /** X position in grid units */
  x: number;
  /** Y position in grid units */
  y: number;
}

/**
 * A widget on a dashboard
 */
export interface DashboardWidget {
  /** Unique widget ID */
  id: string;
  /** Widget display type */
  type: WidgetType;
  /** Widget title */
  title: string;
  /** Reference to a report definition (mutually exclusive with pipeline) */
  reportId?: string;
  /** Inline aggregation pipeline (mutually exclusive with reportId) */
  pipeline?: AggregationPipeline;
  /** Widget size */
  size: WidgetSize;
  /** Widget position */
  position: WidgetPosition;
  /** Auto-refresh interval in seconds (0 = no refresh) */
  refreshInterval?: number;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  /** Number of grid columns */
  columns: number;
  /** Row height in pixels */
  rowHeight: number;
}

/**
 * A dashboard definition
 */
export interface DashboardDefinition {
  /** Unique dashboard ID */
  id: string;
  /** Dashboard name */
  name: string;
  /** Dashboard description */
  description?: string;
  /** Widgets on this dashboard */
  widgets: DashboardWidget[];
  /** Grid layout configuration */
  layout: DashboardLayout;
  /** Owner user ID */
  owner: string;
  /** Whether the dashboard is shared with others */
  shared: boolean;
  /** ISO date of creation */
  createdAt: string;
}

// ─── Scheduled Reports ────────────────────────────────────────────

/**
 * Export format for scheduled reports
 */
export type ScheduledReportFormat = 'pdf' | 'csv' | 'json';

/**
 * A scheduled report configuration
 */
export interface ScheduledReport {
  /** Unique schedule ID */
  id: string;
  /** Report definition ID to execute */
  reportId: string;
  /** Cron expression (minute hour day-of-month month day-of-week) */
  cron: string;
  /** Recipient email addresses */
  recipients: string[];
  /** Export format */
  format: ScheduledReportFormat;
  /** Whether the schedule is enabled */
  enabled: boolean;
  /** ISO date of last execution (null if never run) */
  lastRun: string | null;
  /** ISO date of next scheduled execution */
  nextRun: string;
}

// ─── Report List Options ──────────────────────────────────────────

/**
 * Options for listing reports
 */
export interface ReportListOptions {
  /** Filter by object name */
  objectName?: string;
  /** Filter by creator */
  createdBy?: string;
  /** Filter by format */
  format?: ReportFormat;
}

// ─── Plugin Lifecycle Manifests ───────────────────────────────────

/**
 * Plugin health report
 */
export interface PluginHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

/**
 * Plugin capability manifest
 */
export interface PluginCapabilityManifest {
  id: string;
  provides: string[];
  consumes: string[];
}

/**
 * Plugin security manifest
 */
export interface PluginSecurityManifest {
  permissions: string[];
  dataAccess: string[];
}

/**
 * Plugin startup result
 */
export interface PluginStartupResult {
  success: boolean;
  message?: string;
}
