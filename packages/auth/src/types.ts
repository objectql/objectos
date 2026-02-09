/**
 * Types for @objectos/auth
 */

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
