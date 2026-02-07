/**
 * Types for @objectos/auth
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

// ─── Security Policy Types ─────────────────────────────────────────────────────

/** Password policy configuration */
export interface PasswordPolicy {
  /** Minimum password length */
  minLength?: number;
  /** Maximum password length */
  maxLength?: number;
  /** Require uppercase letters */
  requireUppercase?: boolean;
  /** Require lowercase letters */
  requireLowercase?: boolean;
  /** Require numeric digits */
  requireNumbers?: boolean;
  /** Require special characters */
  requireSpecialChars?: boolean;
  /** Number of previous passwords to remember (prevent reuse) */
  passwordHistory?: number;
  /** Password expiry in days (0 = never) */
  expiryDays?: number;
  /** Minimum age in days before password can be changed */
  minAgeDays?: number;
  /** Maximum failed login attempts before lockout */
  maxFailedAttempts?: number;
  /** Account lockout duration in minutes */
  lockoutDurationMinutes?: number;
}

/** Session policy configuration */
export interface SessionPolicy {
  /** Maximum session duration in minutes */
  maxDurationMinutes?: number;
  /** Idle timeout in minutes */
  idleTimeoutMinutes?: number;
  /** Maximum concurrent sessions per user */
  maxConcurrentSessions?: number;
  /** Whether to enforce single-session (new login kills old session) */
  singleSession?: boolean;
  /** Whether to bind session to IP address */
  bindToIp?: boolean;
  /** Whether to bind session to user agent */
  bindToUserAgent?: boolean;
  /** Require re-authentication for sensitive operations */
  requireReauthForSensitive?: boolean;
  /** Re-authentication timeout in minutes */
  reauthTimeoutMinutes?: number;
}

/** Combined auth security policies */
export interface AuthSecurityPolicies {
  password?: PasswordPolicy;
  session?: SessionPolicy;
}
