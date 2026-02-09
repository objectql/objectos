/**
 * Types for @objectos/realtime
 */

// ─── Kernel Compliance Types (from @objectstack/spec) ──────────────────────────

import type { z } from 'zod';
import type {
  PluginHealthStatusSchema,
  PluginHealthReportSchema,
  PluginCapabilityManifestSchema,
  PluginSecurityManifestSchema,
  PluginStartupResultSchema,
  EventBusConfigSchema,
} from '@objectstack/spec/kernel';

/** Plugin health status — from @objectstack/spec */
export type HealthStatus = z.infer<typeof PluginHealthStatusSchema>;

/** Aggregate health report — from @objectstack/spec */
export type PluginHealthReport = z.infer<typeof PluginHealthReportSchema>;

/** Plugin capability manifest — from @objectstack/spec */
export type PluginCapabilityManifest = z.infer<typeof PluginCapabilityManifestSchema>;

/** Plugin security manifest — from @objectstack/spec */
export type PluginSecurityManifest = z.infer<typeof PluginSecurityManifestSchema>;

/** Plugin startup result — from @objectstack/spec */
export type PluginStartupResult = z.infer<typeof PluginStartupResultSchema>;

/** Event bus configuration — from @objectstack/spec */
export type EventBusConfig = z.infer<typeof EventBusConfigSchema>;

// ─── Realtime Protocol Types ───────────────────────────────────────────────────

/** WebSocket authentication configuration */
export interface WebSocketAuthConfig {
  /** Whether authentication is required for WebSocket connections */
  required?: boolean;
  /** Auth token header name (for upgrade request) */
  tokenHeader?: string;
  /** Auth token query parameter name */
  tokenQueryParam?: string;
  /** Token validation strategy */
  strategy?: 'jwt' | 'session' | 'custom';
  /** Custom token validator function */
  validator?: (token: string) => Promise<WebSocketAuthResult>;
}

/** WebSocket authentication result */
export interface WebSocketAuthResult {
  /** Whether authentication succeeded */
  authenticated: boolean;
  /** Authenticated user ID */
  userId?: string;
  /** User's tenant/organization ID */
  tenantId?: string;
  /** User's roles */
  roles?: string[];
  /** Error message if authentication failed */
  error?: string;
}

/** WebSocket tenant scoping configuration */
export interface WebSocketTenantConfig {
  /** Whether tenant isolation is enabled */
  enabled?: boolean;
  /** Strategy for tenant identification */
  strategy?: 'header' | 'subdomain' | 'token-claim';
  /** Header name for tenant ID */
  headerName?: string;
}

/** Enhanced realtime plugin options with auth and tenant support */
export interface RealtimePluginConfig {
  /** WebSocket server port */
  port?: number;
  /** WebSocket server path */
  path?: string;
  /** Authentication configuration */
  auth?: WebSocketAuthConfig;
  /** Tenant scoping configuration */
  tenant?: WebSocketTenantConfig;
  /** Maximum message size in bytes */
  maxMessageSize?: number;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
  /** Maximum connections per tenant */
  maxConnectionsPerTenant?: number;
}

// ─── Awareness Protocol Schemas ────────────────────────────────────────────────

/** Cursor position within a document or field */
export interface AwarenessCursor {
  /** User who owns this cursor */
  userId: string;
  /** Object/record type being edited */
  object?: string;
  /** Record ID being edited */
  recordId?: string;
  /** Field name the cursor is in */
  field?: string;
  /** Character offset position */
  offset?: number;
  /** Line number (for multi-line fields) */
  line?: number;
  /** Column number (for multi-line fields) */
  column?: number;
}

/** Text selection range within a document or field */
export interface AwarenessSelection {
  /** User who owns this selection */
  userId: string;
  /** Object/record type being edited */
  object?: string;
  /** Record ID being edited */
  recordId?: string;
  /** Field name the selection is in */
  field?: string;
  /** Selection start offset */
  anchor: number;
  /** Selection end offset */
  head: number;
}

/** User presence state for awareness */
export interface AwarenessPresence {
  /** User identifier */
  userId: string;
  /** Display name for the user */
  displayName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** User's assigned color (for collaborative cursors) */
  color?: string;
  /** Current online status */
  status: 'online' | 'offline' | 'away' | 'busy';
  /** What the user is currently viewing or editing */
  activeContext?: {
    /** Object type the user is viewing */
    object?: string;
    /** Record ID the user is viewing */
    recordId?: string;
    /** View or page identifier */
    view?: string;
  };
  /** Last activity timestamp (ISO 8601) */
  lastActive: string;
}

/** Collaborative edit operation for awareness */
export interface AwarenessEdit {
  /** User performing the edit */
  userId: string;
  /** Object/record type being edited */
  object: string;
  /** Record ID being edited */
  recordId: string;
  /** Field being edited */
  field: string;
  /** Type of edit operation */
  operation: 'insert' | 'delete' | 'replace';
  /** Value or delta of the edit */
  value?: unknown;
  /** Edit position offset */
  offset?: number;
  /** Length of text being replaced/deleted */
  length?: number;
}

/** Aggregated awareness state for a context (room/document) */
export interface AwarenessState {
  /** Context identifier (e.g., "record:Account:001") */
  contextId: string;
  /** All users present in this context */
  users: AwarenessPresence[];
  /** Active cursors in this context */
  cursors: AwarenessCursor[];
  /** Active selections in this context */
  selections: AwarenessSelection[];
}
