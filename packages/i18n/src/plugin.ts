/**
 * I18n Plugin for ObjectOS
 * 
 * Provides internationalization and localization support:
 * - Multi-locale translation management
 * - Variable interpolation and pluralization
 * - Number and date formatting
 * - Nested key lookup
 * - Fallback locale support
 * - JSON and YAML translation files
 * 
 * Features:
 * - Lightweight (no i18next dependency)
 * - Plugin namespace isolation
 * - Missing translation warnings
 * - Dynamic locale switching
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { 
    I18nConfig, 
    TranslationData, 
    SupportedLocale,
    InterpolationOptions,
    TranslationResult,
    NumberFormatOptions,
    DateFormatOptions,
    PluginHealthReport,
    PluginCapabilityManifest,
    PluginSecurityManifest,
    PluginStartupResult,
} from './types.js';
import { interpolate, pluralize, processDirectives, formatNumber, formatDate } from './interpolation.js';

/**
 * I18n Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class I18nPlugin implements Plugin {
    name = '@objectos/i18n';
    version = '0.1.0';
    dependencies: string[] = [];

    private context?: PluginContext;
    private currentLocale: string;
    private defaultLocale: string;
    private fallbackLocale?: string;
    private translations: Map<SupportedLocale, TranslationData>;
    private warnOnMissing: boolean;
    private onMissingTranslation?: (key: string, locale: string) => string;
    private interpolationDelimiters: { start: string; end: string };
    private yamlEnabled: boolean;
    private startedAt?: number;

    constructor(config: I18nConfig = { defaultLocale: 'en' }) {
        this.defaultLocale = config.defaultLocale;
        this.currentLocale = config.defaultLocale;
        this.fallbackLocale = config.fallbackLocale;
        this.translations = new Map();
        this.warnOnMissing = config.warnOnMissing ?? true;
        this.onMissingTranslation = config.onMissingTranslation;
        this.interpolationDelimiters = config.interpolationDelimiters || { start: '{{', end: '}}' };
        this.yamlEnabled = config.enableYaml ?? false;

        // Load initial translations
        if (config.translations) {
            for (const [locale, data] of Object.entries(config.translations)) {
                this.translations.set(locale, data);
            }
        }
    }

    /**
     * Initialize plugin
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;
        this.startedAt = Date.now();

        // Register i18n service
        context.registerService('i18n', this);

        context.logger.info(`[I18n] Initialized with default locale: ${this.defaultLocale}`);
    }

    /**
     * Start plugin
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[I18n] Started successfully');
    }

    /**
     * Translate a key
     * 
     * @param key - Translation key (supports nested: 'user.profile.name')
     * @param params - Interpolation parameters
     * @returns The translated string
     */
    t(key: string, params?: InterpolationOptions): string {
        const result = this.lookup(key, this.currentLocale);
        
        if (!result.found && this.warnOnMissing) {
            this.context?.logger.warn(`[I18n] Missing translation: ${key} (locale: ${this.currentLocale})`);
        }

        let translation = result.value;

        // Handle custom missing translation
        if (!result.found && this.onMissingTranslation) {
            translation = this.onMissingTranslation(key, this.currentLocale);
        }

        // Apply interpolation if params provided
        if (params) {
            // Check for pluralization (if params has 'count')
            if ('count' in params && typeof params.count === 'number') {
                const pluralData = this.lookupRaw(key, this.currentLocale);
                if (pluralData && typeof pluralData === 'object') {
                    return pluralize(pluralData, { ...params, count: params.count });
                }
            }
            
            // Process directives and interpolation
            translation = processDirectives(translation, params, this.currentLocale);
        }

        return translation;
    }

    /**
     * Get current locale
     */
    getLocale(): string {
        return this.currentLocale;
    }

    /**
     * Set current locale
     */
    setLocale(locale: string): void {
        if (!this.translations.has(locale)) {
            this.context?.logger.warn(`[I18n] Locale not loaded: ${locale}`);
        }
        this.currentLocale = locale;
        this.context?.logger.info(`[I18n] Locale changed to: ${locale}`);
    }

    /**
     * Load translations for a locale
     * Replaces existing translations for that locale
     */
    loadTranslations(locale: string, data: TranslationData): void {
        this.translations.set(locale, data);
        this.context?.logger.info(`[I18n] Loaded translations for locale: ${locale}`);
    }

    /**
     * Add translations to a locale under a namespace
     * Merges with existing translations
     */
    addTranslations(locale: string, namespace: string, data: TranslationData): void {
        const existing = this.translations.get(locale) || {};
        const updated = this.deepMerge(existing, { [namespace]: data });
        this.translations.set(locale, updated);
        this.context?.logger.info(`[I18n] Added translations for ${locale}:${namespace}`);
    }

    /**
     * Check if a translation exists
     */
    hasTranslation(key: string, locale?: string): boolean {
        const targetLocale = locale || this.currentLocale;
        const result = this.lookup(key, targetLocale);
        return result.found;
    }

    /**
     * Get all loaded locales
     */
    getLoadedLocales(): string[] {
        return Array.from(this.translations.keys());
    }

    /**
     * Load translations from JSON file
     */
    async loadFromJson(locale: string, filePath: string): Promise<void> {
        try {
            const fs = await import('fs/promises');
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            this.loadTranslations(locale, data);
        } catch (error) {
            this.context?.logger.error(`[I18n] Failed to load JSON: ${filePath}`, error as Error);
            throw error;
        }
    }

    /**
     * Load translations from YAML file
     * Requires js-yaml to be installed
     */
    async loadFromYaml(locale: string, filePath: string): Promise<void> {
        if (!this.yamlEnabled) {
            throw new Error('YAML support is not enabled. Set enableYaml: true in config.');
        }

        try {
            const yaml = await import('js-yaml');
            const fs = await import('fs/promises');
            const content = await fs.readFile(filePath, 'utf-8');
            const data = yaml.load(content) as TranslationData;
            this.loadTranslations(locale, data);
        } catch (error) {
            this.context?.logger.error(`[I18n] Failed to load YAML: ${filePath}`, error as Error);
            throw error;
        }
    }

    /**
     * Format a number using current locale
     */
    formatNumber(value: number, options?: NumberFormatOptions): string {
        return formatNumber(value, this.currentLocale, options);
    }

    /**
     * Format a date using current locale
     */
    formatDate(value: Date, options?: DateFormatOptions): string {
        return formatDate(value, this.currentLocale, options);
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const locales = this.getLoadedLocales();
        return {
            pluginName: this.name,
            pluginVersion: this.version,
            status: 'healthy',
            uptime: this.startedAt ? Date.now() - this.startedAt : 0,
            checks: [{ name: 'i18n-translations', status: 'healthy', message: `${locales.length} locales loaded (current: ${this.currentLocale})`, latency: 0, timestamp: new Date().toISOString() }],
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: { services: ['i18n'], emits: [], listens: [], routes: [], objects: [] },
            security: { requiredPermissions: [], handlesSensitiveData: false, makesExternalCalls: false },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { pluginName: this.name, success: !!this.context, duration: 0, servicesRegistered: ['i18n'] };
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        this.translations.clear();
        this.context?.logger.info('[I18n] Destroyed');
    }

    /**
     * Lookup a translation by key
     * Supports nested keys with dot notation: 'user.profile.name'
     */
    private lookup(key: string, locale: string): TranslationResult {
        // Try current locale
        const value = this.resolveNestedKey(key, locale);
        if (value !== null) {
            return {
                value,
                found: true,
                locale,
                usedFallback: false
            };
        }

        // Try fallback locale
        if (this.fallbackLocale && this.fallbackLocale !== locale) {
            const fallbackValue = this.resolveNestedKey(key, this.fallbackLocale);
            if (fallbackValue !== null) {
                return {
                    value: fallbackValue,
                    found: true,
                    locale: this.fallbackLocale,
                    usedFallback: true
                };
            }
        }

        // Not found - return the key itself
        return {
            value: key,
            found: false,
            locale,
            usedFallback: false
        };
    }

    /**
     * Lookup raw translation data (for pluralization)
     */
    private lookupRaw(key: string, locale: string): any {
        const data = this.translations.get(locale);
        if (!data) return null;

        const keys = key.split('.');
        let current: any = data;

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Resolve a nested key to its string value
     */
    private resolveNestedKey(key: string, locale: string): string | null {
        const raw = this.lookupRaw(key, locale);
        
        // Must be a string to be valid
        if (typeof raw === 'string') {
            return raw;
        }
        
        return null;
    }

    /**
     * Deep merge two objects
     */
    private deepMerge(target: any, source: any): any {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
}

/**
 * Helper function to access the i18n API from kernel
 */
export function getI18nAPI(kernel: any): I18nPlugin | null {
    try {
        return kernel.getService('i18n');
    } catch {
        return null;
    }
}
