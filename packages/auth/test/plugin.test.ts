/**
 * Basic test for Better-Auth Plugin
 */

import { BetterAuthPlugin } from '../src/index.js';

describe('Better-Auth Plugin', () => {
    it('should export BetterAuthPlugin class', () => {
        expect(BetterAuthPlugin).toBeDefined();
        expect(typeof BetterAuthPlugin).toBe('function');
    });

    it('should create plugin instance with default config', () => {
        const plugin = new BetterAuthPlugin();
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe('@objectos/auth');
        expect(plugin.version).toBe('0.1.0');
        expect(plugin.dependencies).toEqual([]);
    });

    it('should create plugin with custom options', () => {
        const customPlugin = new BetterAuthPlugin({
            baseURL: 'https://example.com/auth',
            trustedOrigins: ['https://example.com']
        });
        expect(customPlugin).toBeDefined();
        expect(customPlugin.name).toBe('@objectos/auth');
    });

    it('should have all lifecycle methods', () => {
        const plugin = new BetterAuthPlugin();
        expect(typeof plugin.init).toBe('function');
        expect(typeof plugin.start).toBe('function');
        expect(typeof plugin.destroy).toBe('function');
    });

    it('should have helper methods', () => {
        const plugin = new BetterAuthPlugin();
        expect(typeof plugin.getAuthInstance).toBe('function');
        expect(typeof plugin.getHandler).toBe('function');
    });

    it('should have correct plugin metadata', () => {
        const plugin = new BetterAuthPlugin();
        expect(plugin.name).toBe('@objectos/auth');
        expect(plugin.version).toBe('0.1.0');
        expect(Array.isArray(plugin.dependencies)).toBe(true);
    });

    it('should accept security policies configuration', () => {
        const plugin = new BetterAuthPlugin({
            securityPolicies: {
                password: {
                    minLength: 12,
                    maxLength: 64,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    maxFailedAttempts: 5,
                    lockoutDurationMinutes: 30,
                },
                session: {
                    maxDurationMinutes: 480,
                    idleTimeoutMinutes: 30,
                    maxConcurrentSessions: 3,
                    singleSession: false,
                    bindToIp: true,
                    bindToUserAgent: true,
                },
            },
        });
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe('@objectos/auth');
    });

    it('should declare session lifecycle events in manifest', () => {
        const plugin = new BetterAuthPlugin();
        const manifest = plugin.getManifest();
        expect(manifest.capabilities).toBeDefined();
    });
});

describe('Auth Type Exports', () => {
    it('should export policy types', async () => {
        const mod = await import('../src/index.js');
        // IdentitySchemas should be a namespace export
        expect(mod.IdentitySchemas).toBeDefined();
    });
});
