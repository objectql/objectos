/**
 * Interpolation utilities for I18n Plugin
 * 
 * Handles variable substitution, pluralization, and formatting.
 */

import type { 
    InterpolationOptions, 
    PluralizationOptions,
    NumberFormatOptions,
    DateFormatOptions 
} from './types';

/**
 * Default interpolation delimiters
 */
const DEFAULT_START_DELIMITER = '{{';
const DEFAULT_END_DELIMITER = '}}';

/**
 * Interpolate variables into a translation string
 * 
 * @param template - The translation template (e.g., "Hello {{name}}")
 * @param params - Variables to interpolate
 * @param delimiters - Custom delimiters (optional)
 * @returns The interpolated string
 */
export function interpolate(
    template: string,
    params?: InterpolationOptions,
    delimiters?: { start: string; end: string }
): string {
    if (!params || typeof template !== 'string') {
        return template;
    }

    const startDelim = delimiters?.start || DEFAULT_START_DELIMITER;
    const endDelim = delimiters?.end || DEFAULT_END_DELIMITER;
    
    let result = template;
    
    // Replace all {{variable}} patterns
    for (const [key, value] of Object.entries(params)) {
        const pattern = `${escapeRegExp(startDelim)}\\s*${key}\\s*${escapeRegExp(endDelim)}`;
        const regex = new RegExp(pattern, 'g');
        result = result.replace(regex, String(value));
    }
    
    return result;
}

/**
 * Handle pluralization in translations
 * 
 * Supports formats:
 * - "{{count}} item" / "{{count}} items"
 * - Keys: "message.one", "message.other"
 * 
 * @param translations - The translation object with plural forms
 * @param params - Must include 'count' property
 * @returns The appropriate plural form
 */
export function pluralize(
    translations: any,
    params: PluralizationOptions
): string {
    const count = params.count;
    
    // If translations is a string, just interpolate
    if (typeof translations === 'string') {
        return interpolate(translations, params);
    }
    
    // Check for plural forms: zero, one, two, few, many, other
    let form: string;
    
    if (count === 0 && translations.zero) {
        form = translations.zero;
    } else if (count === 1 && translations.one) {
        form = translations.one;
    } else if (count === 2 && translations.two) {
        form = translations.two;
    } else if (translations.other) {
        form = translations.other;
    } else {
        // Default to 'one' or first available form
        form = translations.one || Object.values(translations)[0] as string;
    }
    
    return interpolate(form, params);
}

/**
 * Format a number according to locale
 * 
 * @param value - The number to format
 * @param locale - The locale to use
 * @param options - Formatting options
 * @returns The formatted number string
 */
export function formatNumber(
    value: number,
    locale: string,
    options?: NumberFormatOptions
): string {
    try {
        const formatter = new Intl.NumberFormat(locale, options);
        return formatter.format(value);
    } catch (error) {
        // Fallback to simple string conversion
        return String(value);
    }
}

/**
 * Format a date according to locale
 * 
 * @param value - The date to format
 * @param locale - The locale to use
 * @param options - Formatting options
 * @returns The formatted date string
 */
export function formatDate(
    value: Date,
    locale: string,
    options?: DateFormatOptions
): string {
    try {
        const formatter = new Intl.DateTimeFormat(locale, options);
        return formatter.format(value);
    } catch (error) {
        // Fallback to ISO string
        return value.toISOString();
    }
}

/**
 * Process special interpolation directives
 * 
 * Supports:
 * - {{variable | number}} - Number formatting
 * - {{variable | currency:USD}} - Currency formatting
 * - {{variable | date}} - Date formatting
 * 
 * @param template - The translation template
 * @param params - Variables to interpolate
 * @param locale - The current locale
 * @returns The processed string
 */
export function processDirectives(
    template: string,
    params: InterpolationOptions,
    locale: string
): string {
    let result = template;
    
    // Process number formatting: {{value | number}}
    const numberPattern = /\{\{\s*(\w+)\s*\|\s*number\s*\}\}/g;
    result = result.replace(numberPattern, (match, key) => {
        const value = params[key];
        if (typeof value === 'number') {
            return formatNumber(value, locale);
        }
        return match;
    });
    
    // Process currency formatting: {{value | currency:USD}}
    const currencyPattern = /\{\{\s*(\w+)\s*\|\s*currency:(\w+)\s*\}\}/g;
    result = result.replace(currencyPattern, (match, key, currency) => {
        const value = params[key];
        if (typeof value === 'number') {
            return formatNumber(value, locale, { style: 'currency', currency });
        }
        return match;
    });
    
    // Process date formatting: {{value | date}}
    const datePattern = /\{\{\s*(\w+)\s*\|\s*date\s*\}\}/g;
    result = result.replace(datePattern, (match, key) => {
        const value = params[key];
        if (value instanceof Date) {
            return formatDate(value, locale, { dateStyle: 'medium' });
        }
        return match;
    });
    
    // After directive processing, do regular interpolation
    return interpolate(result, params);
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
