/**
 * UI Plugin Types
 *
 * Defines the configuration and record types for the UI metadata service.
 * View definitions are persisted in a database via ObjectQL.
 */

// ─── View Record ───────────────────────────────────────────────────────────────

/**
 * Database record representing a stored view definition.
 */
export interface ViewRecord {
  /** Auto-generated identifier */
  _id?: string;
  /** Unique view name (snake_case) */
  name: string;
  /** Object this view belongs to */
  object_name: string;
  /** Human-readable label */
  label?: string;
  /** View type discriminator */
  type: string;
  /** Full view definition stored as JSON */
  definition: Record<string, unknown>;
  /** Whether this is the default view for the object */
  is_default?: boolean;
  /** Whether this view is visible to all users */
  is_public?: boolean;
}

// ─── Plugin Configuration ──────────────────────────────────────────────────────

/**
 * UI Plugin Configuration
 */
export interface UIServiceConfig {
  /** Name of the ObjectQL object used to store views (default: 'sys_view') */
  viewObjectName?: string;
}

// ─── Kernel Compliance Types (from @objectstack/spec) ──────────────────────────

import type {
  PluginHealthStatus,
  PluginHealthReport as SpecPluginHealthReport,
  PluginCapabilityManifest as SpecPluginCapabilityManifest,
  PluginSecurityManifest as SpecPluginSecurityManifest,
  PluginStartupResult as SpecPluginStartupResult,
  EventBusConfig as SpecEventBusConfig,
} from '@objectstack/spec/kernel';

/** Plugin health status — from @objectstack/spec */
export type HealthStatus = PluginHealthStatus;

/** Aggregate health report — from @objectstack/spec */
export type PluginHealthReport = SpecPluginHealthReport;

/** Plugin capability manifest — from @objectstack/spec */
export type PluginCapabilityManifest = SpecPluginCapabilityManifest;

/** Plugin security manifest — from @objectstack/spec */
export type PluginSecurityManifest = SpecPluginSecurityManifest;

/** Plugin startup result — from @objectstack/spec */
export type PluginStartupResult = SpecPluginStartupResult;

/** Event bus configuration — from @objectstack/spec */
export type EventBusConfig = SpecEventBusConfig;
