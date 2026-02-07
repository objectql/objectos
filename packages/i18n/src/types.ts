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
