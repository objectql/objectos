/**
 * I18n Plugin Types
 *
 * Defines the types for internationalization and localization support.
 */

/**
 * Supported locale type (e.g., 'en', 'zh-CN', 'fr-FR')
 */
export type SupportedLocale = string;

/**
 * Translation data structure
 * Supports nested objects for namespacing
 */
export type TranslationData = {
  [key: string]: string | TranslationData;
};

/**
 * Interpolation options for variable substitution
 */
export interface InterpolationOptions {
  /**
   * Variables to interpolate into the translation
   */
  [key: string]: string | number | boolean | Date;
}

/**
 * Pluralization options
 */
export interface PluralizationOptions extends InterpolationOptions {
  /**
   * The count for pluralization
   */
  count: number;
}

/**
 * I18n Plugin Configuration
 */
export interface I18nConfig {
  /**
   * Default locale (e.g., 'en')
   */
  defaultLocale: string;

  /**
   * Fallback locale when translation is missing
   */
  fallbackLocale?: string;

  /**
   * Initial translations data
   * Structure: { locale: { namespace: { key: value } } }
   */
  translations?: Record<SupportedLocale, TranslationData>;

  /**
   * Enable missing translation warnings
   */
  warnOnMissing?: boolean;

  /**
   * Custom missing translation handler
   */
  onMissingTranslation?: (key: string, locale: string) => string;

  /**
   * Interpolation delimiters (default: '{{' and '}}')
   */
  interpolationDelimiters?: {
    start: string;
    end: string;
  };

  /**
   * Enable YAML support (requires js-yaml)
   */
  enableYaml?: boolean;
}

/**
 * Translation lookup result
 */
export interface TranslationResult {
  /**
   * The translated string
   */
  value: string;

  /**
   * Whether the translation was found
   */
  found: boolean;

  /**
   * The locale used for the translation
   */
  locale: string;

  /**
   * Whether fallback was used
   */
  usedFallback: boolean;
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Date format options
 */
export interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
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
