/**
 * Types for @objectos/realtime
 */

// ─── Kernel Compliance Types ───────────────────────────────────────────────────

/** Plugin health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Health check result for a single check */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latency?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Aggregate health report for a plugin */
export interface PluginHealthReport {
  pluginName: string;
  pluginVersion: string;
  status: HealthStatus;
  uptime: number;
  checks: HealthCheckResult[];
  timestamp: string;
}

/** Plugin capability declaration */
export interface PluginCapabilityManifest {
  services?: string[];
  emits?: string[];
  listens?: string[];
  routes?: string[];
  objects?: string[];
}

/** Plugin security manifest */
export interface PluginSecurityManifest {
  requiredPermissions?: string[];
  handlesSensitiveData?: boolean;
  makesExternalCalls?: boolean;
  allowedDomains?: string[];
  executesUserScripts?: boolean;
  sandboxConfig?: {
    timeout?: number;
    maxMemory?: number;
    allowedModules?: string[];
  };
}

/** Plugin startup result */
export interface PluginStartupResult {
  pluginName: string;
  success: boolean;
  duration: number;
  servicesRegistered: string[];
  warnings?: string[];
  errors?: string[];
}

/** Event bus configuration */
export interface EventBusConfig {
  persistence?: {
    enabled: boolean;
    storage?: 'memory' | 'redis' | 'sqlite';
    maxEvents?: number;
    ttl?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
  };
  deadLetterQueue?: {
    enabled: boolean;
    maxSize?: number;
    storage?: 'memory' | 'redis' | 'sqlite';
  };
  webhooks?: {
    enabled: boolean;
    endpoints?: Array<{
      url: string;
      events: string[];
      secret?: string;
      timeout?: number;
    }>;
  };
}

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
