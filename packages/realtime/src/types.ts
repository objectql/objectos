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
