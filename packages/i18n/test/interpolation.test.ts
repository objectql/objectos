/**
 * Interpolation Tests
 */

import { 
    interpolate, 
    pluralize, 
    formatNumber, 
    formatDate,
    processDirectives 
} from '../src/interpolation.js';

describe('Interpolation', () => {
    describe('interpolate', () => {
        it('should replace simple variables', () => {
            const result = interpolate('Hello, {{name}}!', { name: 'Alice' });
            expect(result).toBe('Hello, Alice!');
        });

        it('should handle multiple variables', () => {
            const result = interpolate('{{greeting}}, {{name}}! You have {{count}} messages.', {
                greeting: 'Hello',
                name: 'Bob',
                count: 5
            });
            expect(result).toBe('Hello, Bob! You have 5 messages.');
        });

        it('should handle variables with whitespace', () => {
            const result = interpolate('Hello, {{ name }}!', { name: 'Charlie' });
            expect(result).toBe('Hello, Charlie!');
        });

        it('should handle missing variables gracefully', () => {
            const result = interpolate('Hello, {{name}}!', {});
            expect(result).toBe('Hello, {{name}}!');
        });

        it('should handle templates without variables', () => {
            const result = interpolate('Hello, World!', { name: 'Alice' });
            expect(result).toBe('Hello, World!');
        });

        it('should handle boolean and number values', () => {
            const result = interpolate('Active: {{active}}, Count: {{count}}', {
                active: true,
                count: 42
            });
            expect(result).toBe('Active: true, Count: 42');
        });

        it('should support custom delimiters', () => {
            const result = interpolate('Hello, [[name]]!', { name: 'Dave' }, {
                start: '[[',
                end: ']]'
            });
            expect(result).toBe('Hello, Dave!');
        });
    });

    describe('pluralize', () => {
        it('should handle singular form', () => {
            const translations = {
                one: '{{count}} item',
                other: '{{count}} items'
            };
            const result = pluralize(translations, { count: 1 });
            expect(result).toBe('1 item');
        });

        it('should handle plural form', () => {
            const translations = {
                one: '{{count}} item',
                other: '{{count}} items'
            };
            const result = pluralize(translations, { count: 5 });
            expect(result).toBe('5 items');
        });

        it('should handle zero form when available', () => {
            const translations = {
                zero: 'No items',
                one: '{{count}} item',
                other: '{{count}} items'
            };
            const result = pluralize(translations, { count: 0 });
            expect(result).toBe('No items');
        });

        it('should handle string translations', () => {
            const result = pluralize('{{count}} messages', { count: 3 });
            expect(result).toBe('3 messages');
        });

        it('should handle two form', () => {
            const translations = {
                one: 'one item',
                two: 'a couple of items',
                other: 'many items'
            };
            const result = pluralize(translations, { count: 2 });
            expect(result).toBe('a couple of items');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with default options', () => {
            const result = formatNumber(1234.56, 'en-US');
            expect(result).toBe('1,234.56');
        });

        it('should format currency', () => {
            const result = formatNumber(1234.56, 'en-US', {
                style: 'currency',
                currency: 'USD'
            });
            expect(result).toBe('$1,234.56');
        });

        it('should format percentages', () => {
            const result = formatNumber(0.75, 'en-US', {
                style: 'percent'
            });
            expect(result).toBe('75%');
        });

        it('should handle invalid locale gracefully', () => {
            const result = formatNumber(1234, 'invalid-locale');
            expect(typeof result).toBe('string');
        });
    });

    describe('formatDate', () => {
        const testDate = new Date('2024-01-15T12:30:00Z');

        it('should format dates with medium style', () => {
            const result = formatDate(testDate, 'en-US', { dateStyle: 'medium' });
            expect(result).toContain('Jan');
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });

        it('should format dates with time', () => {
            const result = formatDate(testDate, 'en-US', { 
                dateStyle: 'short',
                timeStyle: 'short'
            });
            expect(typeof result).toBe('string');
        });

        it('should handle invalid locale gracefully', () => {
            const result = formatDate(testDate, 'invalid-locale');
            expect(result).toContain('2024');
        });
    });

    describe('processDirectives', () => {
        it('should process number directive', () => {
            const result = processDirectives('Total: {{value | number}}', 
                { value: 1234.56 }, 
                'en-US'
            );
            expect(result).toBe('Total: 1,234.56');
        });

        it('should process currency directive', () => {
            const result = processDirectives('Price: {{amount | currency:USD}}', 
                { amount: 99.99 }, 
                'en-US'
            );
            expect(result).toBe('Price: $99.99');
        });

        it('should process date directive', () => {
            const testDate = new Date('2024-01-15T12:30:00Z');
            const result = processDirectives('Published: {{date | date}}', 
                { date: testDate }, 
                'en-US'
            );
            expect(result).toContain('Jan');
        });

        it('should handle mixed directives and regular interpolation', () => {
            const result = processDirectives('Hello {{name}}, balance: {{amount | currency:USD}}', 
                { name: 'Alice', amount: 1234.56 }, 
                'en-US'
            );
            expect(result).toBe('Hello Alice, balance: $1,234.56');
        });

        it('should preserve non-matching patterns', () => {
            const result = processDirectives('{{value | unknown}}', 
                { value: 123 }, 
                'en-US'
            );
            expect(result).toBe('{{value | unknown}}');
        });
    });
});
