/**
 * I18n Plugin Tests
 */

import { I18nPlugin } from '../src/plugin.js';
import type { PluginContext } from '@objectstack/runtime';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock PluginContext
const createMockContext = (): PluginContext => {
    const services = new Map();
    
    return {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        },
        registerService: jest.fn((name: string, service: any) => {
            services.set(name, service);
        }),
        getService: jest.fn((name: string) => {
            const service = services.get(name);
            if (!service) {
                throw new Error(`Service not found: ${name}`);
            }
            return service;
        })
    } as any;
};

describe('I18nPlugin', () => {
    let plugin: I18nPlugin;
    let mockContext: PluginContext;

    beforeEach(() => {
        mockContext = createMockContext();
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize with default locale', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });

            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('i18n', plugin);
            expect(plugin.getLocale()).toBe('en');
        });

        it('should start successfully', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });

            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalled();
        });

        it('should cleanup on destroy', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                translations: {
                    en: { test: 'value' }
                }
            });

            await plugin.init(mockContext);
            await plugin.destroy();

            expect(plugin.getLoadedLocales()).toHaveLength(0);
        });
    });

    describe('Translation Loading', () => {
        beforeEach(() => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });
        });

        it('should load translations from config', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                translations: {
                    en: {
                        greeting: 'Hello',
                        user: {
                            name: 'Name'
                        }
                    }
                }
            });

            await plugin.init(mockContext);

            expect(plugin.t('greeting')).toBe('Hello');
            expect(plugin.t('user.name')).toBe('Name');
        });

        it('should load translations from JSON file', async () => {
            await plugin.init(mockContext);
            
            const fixturesPath = path.join(__dirname, 'fixtures', 'en.json');
            await plugin.loadFromJson('en', fixturesPath);

            expect(plugin.t('app.title')).toBe('My Application');
            expect(plugin.t('user.profile.name')).toBe('Name');
        });

        it('should add translations to namespace', async () => {
            await plugin.init(mockContext);

            plugin.addTranslations('en', 'auth', {
                login: 'Login',
                logout: 'Logout'
            });

            expect(plugin.t('auth.login')).toBe('Login');
            expect(plugin.t('auth.logout')).toBe('Logout');
        });

        it('should list loaded locales', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                translations: {
                    en: { test: 'test' },
                    fr: { test: 'test' }
                }
            });

            await plugin.init(mockContext);

            const locales = plugin.getLoadedLocales();
            expect(locales).toContain('en');
            expect(locales).toContain('fr');
            expect(locales).toHaveLength(2);
        });
    });

    describe('Translation Function (t)', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });
            await plugin.init(mockContext);
            
            const fixturesPath = path.join(__dirname, 'fixtures', 'en.json');
            await plugin.loadFromJson('en', fixturesPath);
        });

        it('should translate simple keys', () => {
            expect(plugin.t('common.save')).toBe('Save');
            expect(plugin.t('common.cancel')).toBe('Cancel');
        });

        it('should translate nested keys', () => {
            expect(plugin.t('user.profile.name')).toBe('Name');
            expect(plugin.t('user.profile.email')).toBe('Email');
        });

        it('should return key when translation missing', () => {
            expect(plugin.t('nonexistent.key')).toBe('nonexistent.key');
        });

        it('should warn on missing translation', () => {
            plugin.t('missing.translation');
            
            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Missing translation')
            );
        });

        it('should use custom missing handler', async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                onMissingTranslation: (key) => `[MISSING: ${key}]`
            });
            await plugin.init(mockContext);

            expect(plugin.t('missing.key')).toBe('[MISSING: missing.key]');
        });
    });

    describe('Locale Switching', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });
            await plugin.init(mockContext);
            
            const enPath = path.join(__dirname, 'fixtures', 'en.json');
            const zhPath = path.join(__dirname, 'fixtures', 'zh.json');
            
            await plugin.loadFromJson('en', enPath);
            await plugin.loadFromJson('zh', zhPath);
        });

        it('should switch locales', () => {
            expect(plugin.t('common.save')).toBe('Save');
            
            plugin.setLocale('zh');
            expect(plugin.getLocale()).toBe('zh');
            expect(plugin.t('common.save')).toBe('保存');
        });

        it('should warn when switching to unloaded locale', () => {
            plugin.setLocale('de');
            
            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Locale not loaded: de')
            );
        });
    });

    describe('Interpolation with Variables', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });
            await plugin.init(mockContext);
            
            const fixturesPath = path.join(__dirname, 'fixtures', 'en.json');
            await plugin.loadFromJson('en', fixturesPath);
        });

        it('should interpolate variables', () => {
            const result = plugin.t('user.greeting', { name: 'Alice' });
            expect(result).toBe('Hello, Alice!');
        });

        it('should interpolate multiple variables', () => {
            const result = plugin.t('user.welcome', { 
                name: 'Bob', 
                count: 5 
            });
            expect(result).toBe('Welcome back, Bob. You have 5 new messages.');
        });

        it('should interpolate with special characters', () => {
            const result = plugin.t('errors.password_too_short', { 
                minLength: 8 
            });
            expect(result).toBe('Password must be at least 8 characters');
        });
    });

    describe('Pluralization', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en'
            });
            await plugin.init(mockContext);
            
            const fixturesPath = path.join(__dirname, 'fixtures', 'en.json');
            await plugin.loadFromJson('en', fixturesPath);
        });

        it('should handle singular form', () => {
            const result = plugin.t('messages', { count: 1 });
            expect(result).toBe('You have 1 message');
        });

        it('should handle plural form', () => {
            const result = plugin.t('messages', { count: 5 });
            expect(result).toBe('You have 5 messages');
        });

        it('should handle zero form when available', () => {
            const result = plugin.t('cart.items', { count: 0 });
            expect(result).toBe('Your cart is empty');
        });

        it('should handle nested plural keys', () => {
            const result = plugin.t('cart.items', { count: 3 });
            expect(result).toBe('3 items in cart');
        });
    });

    describe('Fallback Behavior', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                fallbackLocale: 'en'
            });
            await plugin.init(mockContext);
            
            const enPath = path.join(__dirname, 'fixtures', 'en.json');
            const frPath = path.join(__dirname, 'fixtures', 'fr.json');
            
            await plugin.loadFromJson('en', enPath);
            await plugin.loadFromJson('fr', frPath);
        });

        it('should use fallback locale for missing translations', () => {
            plugin.setLocale('fr');
            
            // Add a key only in English
            plugin.addTranslations('en', 'test', {
                onlyInEnglish: 'Only in English'
            });
            
            // Should fallback to English
            const result = plugin.t('test.onlyInEnglish');
            expect(result).toBe('Only in English');
        });

        it('should prefer current locale over fallback', () => {
            plugin.setLocale('fr');
            
            const result = plugin.t('common.save');
            expect(result).toBe('Enregistrer'); // French, not English
        });
    });

    describe('Missing Translation Handling', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en',
                warnOnMissing: true
            });
            await plugin.init(mockContext);
        });

        it('should check if translation exists', () => {
            plugin.loadTranslations('en', {
                existing: 'value'
            });

            expect(plugin.hasTranslation('existing')).toBe(true);
            expect(plugin.hasTranslation('missing')).toBe(false);
        });

        it('should check translation in specific locale', () => {
            plugin.loadTranslations('en', { key: 'value' });
            plugin.loadTranslations('fr', { autre: 'valeur' });

            expect(plugin.hasTranslation('key', 'en')).toBe(true);
            expect(plugin.hasTranslation('key', 'fr')).toBe(false);
            expect(plugin.hasTranslation('autre', 'fr')).toBe(true);
        });
    });

    describe('Number and Date Formatting', () => {
        beforeEach(async () => {
            plugin = new I18nPlugin({
                defaultLocale: 'en-US'
            });
            await plugin.init(mockContext);
        });

        it('should format numbers', () => {
            const result = plugin.formatNumber(1234.56);
            expect(result).toBe('1,234.56');
        });

        it('should format currency', () => {
            const result = plugin.formatNumber(99.99, {
                style: 'currency',
                currency: 'USD'
            });
            expect(result).toBe('$99.99');
        });

        it('should format dates', () => {
            const date = new Date('2024-01-15T12:30:00Z');
            const result = plugin.formatDate(date, { dateStyle: 'medium' });
            
            expect(result).toContain('Jan');
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });
    });
});

// ─── Kernel Compliance Tests ───────────────────────────────────────────────────

describe('Kernel Compliance', () => {
    let plugin: I18nPlugin;

    beforeEach(async () => {
        plugin = new I18nPlugin({ defaultLocale: 'en', translations: { en: { hello: 'Hello' } } });
        const context = createMockContext();
        await plugin.init(context);
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('healthCheck()', () => {
        it('should return healthy with loaded locales', async () => {
            const report = await plugin.healthCheck();
            expect(report.status).toBe('healthy');
            expect(report.checks![0].message).toContain('1 locales loaded');
        });
    });

    describe('getManifest()', () => {
        it('should declare i18n service', () => {
            const manifest = plugin.getManifest();
            expect(manifest.capabilities).toBeDefined();
            expect(manifest.security).toBeDefined();
        });
    });

    describe('getStartupResult()', () => {
        it('should return successful startup result', () => {
            const result = plugin.getStartupResult();
            expect(result.plugin.name).toBe('@objectos/i18n');
            expect(result.success).toBe(true);
        });
    });
});

// ─── Contract Compliance (II18nService) ────────────────────────────────────────

describe('Contract Compliance (II18nService)', () => {
    let plugin: I18nPlugin;

    beforeEach(async () => {
        plugin = new I18nPlugin({
            defaultLocale: 'en',
            translations: {
                en: { greeting: 'Hello', user: { name: 'Name' } },
                fr: { greeting: 'Bonjour' },
            },
        });
        const context = createMockContext();
        await plugin.init(context);
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('t() with spec signature (key, locale, params)', () => {
        it('should translate using explicit locale parameter', () => {
            const result = plugin.t('greeting', 'en');
            expect(result).toBe('Hello');
        });

        it('should translate with a different locale', () => {
            const result = plugin.t('greeting', 'fr');
            expect(result).toBe('Bonjour');
        });

        it('should accept params as third argument', () => {
            plugin.loadTranslations('en', { welcome: 'Hi {{name}}!' });
            const result = plugin.t('welcome', 'en', { name: 'Alice' });
            expect(result).toContain('Alice');
        });
    });

    describe('getTranslations()', () => {
        it('should return translations for a given locale', () => {
            const translations = plugin.getTranslations('en');
            expect(translations).toBeDefined();
            expect(typeof translations).toBe('object');
            expect(translations).toHaveProperty('greeting');
        });

        it('should return empty object for unknown locale', () => {
            const translations = plugin.getTranslations('xx');
            expect(translations).toEqual({});
        });
    });

    describe('getLocales()', () => {
        it('should return an array of loaded locale strings', () => {
            const locales = plugin.getLocales();
            expect(Array.isArray(locales)).toBe(true);
            expect(locales).toContain('en');
            expect(locales).toContain('fr');
        });
    });

    describe('getDefaultLocale() / setDefaultLocale()', () => {
        it('should return the default locale', () => {
            expect(plugin.getDefaultLocale()).toBe('en');
        });

        it('should change the default locale', () => {
            plugin.setDefaultLocale('fr');
            expect(plugin.getDefaultLocale()).toBe('fr');
        });
    });
});
