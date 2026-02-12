/**
 * @objectos/analytics — Analytics and Reporting Engine for ObjectOS
 *
 * Provides metadata-driven analytics and reporting:
 * - O.4.1: Aggregation pipeline engine
 * - O.4.2: Report definition format and execution
 * - O.4.3: Dashboard widget system
 * - O.4.4: Scheduled report generation
 */

export { AnalyticsPlugin } from './plugin.js';
export { AggregationEngine } from './aggregation.js';
export { ReportManager } from './reports.js';
export { DashboardManager } from './dashboards.js';
export { ReportScheduler } from './scheduler.js';
export type {
  AnalyticsConfig,
  ResolvedAnalyticsConfig,
  AggregationStageType,
  AggregationStage,
  AggregationPipeline,
  AggregationMetadata,
  AggregationResult,
  ReportFormat,
  ReportParameter,
  ReportDefinition,
  ReportResult,
  ReportListOptions,
  WidgetType,
  WidgetSize,
  WidgetPosition,
  DashboardWidget,
  DashboardLayout,
  DashboardDefinition,
  ScheduledReportFormat,
  ScheduledReport,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
