/**
 * Basic test for Better-Auth Plugin
 */

import { BetterAuthPlugin, BetterAuthManifest, createBetterAuthPlugin } from '../src';

describe('Better-Auth Plugin', () => {
    it('should export BetterAuthPlugin', () => {
        expect(BetterAuthPlugin).toBeDefined();
        expect(typeof BetterAuthPlugin).toBe('object');
    });

    it('should export BetterAuthManifest', () => {
        expect(BetterAuthManifest).toBeDefined();
        expect(BetterAuthManifest.id).toBe('com.objectos.auth.better-auth');
        expect(BetterAuthManifest.version).toBe('0.1.0');
        expect(BetterAuthManifest.type).toBe('plugin');
    });

    it('should export createBetterAuthPlugin factory', () => {
        expect(createBetterAuthPlugin).toBeDefined();
        expect(typeof createBetterAuthPlugin).toBe('function');
    });

    it('should create plugin with custom options', () => {
        const customPlugin = createBetterAuthPlugin({
            baseURL: 'https://example.com/auth',
            trustedOrigins: ['https://example.com']
        });
        expect(customPlugin).toBeDefined();
        expect(customPlugin.onInstall).toBeDefined();
        expect(customPlugin.onEnable).toBeDefined();
        expect(customPlugin.onDisable).toBeDefined();
        expect(customPlugin.onUninstall).toBeDefined();
    });

    it('should have all lifecycle hooks', () => {
        expect(typeof BetterAuthPlugin.onInstall).toBe('function');
        expect(typeof BetterAuthPlugin.onEnable).toBe('function');
        expect(typeof BetterAuthPlugin.onDisable).toBe('function');
        expect(typeof BetterAuthPlugin.onUninstall).toBe('function');
    });

    it('manifest should have correct contributes', () => {
        expect(BetterAuthManifest.contributes).toBeDefined();
        expect(BetterAuthManifest.contributes?.events).toBeDefined();
        expect(BetterAuthManifest.contributes?.events?.length).toBeGreaterThan(0);
    });

    it('manifest should define authentication events', () => {
        const events = BetterAuthManifest.contributes?.events || [];
        expect(events).toContain('auth.user.created');
        expect(events).toContain('auth.user.login');
        expect(events).toContain('auth.user.logout');
        expect(events).toContain('auth.session.created');
        expect(events).toContain('auth.session.expired');
    });
});
