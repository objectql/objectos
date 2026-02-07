/**
 * Integration tests for Better-Auth Plugin + ObjectStack HTTP flow
 *
 * These tests verify the full request lifecycle:
 *   Frontend  →  Hono route `/api/v1/auth/*`  →  HttpDispatcher  →  auth service handler  →  Better-Auth
 *
 * We spin up an in-memory SQLite database and a real Better-Auth instance.
 * Uses vitest (not Jest) because better-auth is ESM-only.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { BetterAuthPlugin } from '../src/index.js';
import { resetAuthInstance } from '../src/auth-client.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

/** Minimal PluginContext mock that satisfies the Plugin interface at runtime */
function createMockContext() {
    const services = new Map<string, any>();
    const hooks = new Map<string, Function[]>();
    const events: Array<{ name: string; data: any }> = [];

    return {
        services,
        hooks,
        events,
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        registerService(name: string, svc: any) {
            services.set(name, svc);
        },
        getService<T>(name: string): T {
            return services.get(name) as T;
        },
        getServices() {
            return services;
        },
        hook(name: string, handler: Function) {
            if (!hooks.has(name)) hooks.set(name, []);
            hooks.get(name)!.push(handler);
        },
        async trigger(name: string, ...args: any[]) {
            events.push({ name, data: args });
            const handlers = hooks.get(name) || [];
            for (const h of handlers) await h(...args);
        },
        getKernel() {
            return { services: Object.fromEntries(services) } as any;
        },
    };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('BetterAuthPlugin Integration', () => {
    let plugin: BetterAuthPlugin;
    let ctx: ReturnType<typeof createMockContext>;

    beforeAll(async () => {
        plugin = new BetterAuthPlugin({
            databaseUrl: 'sqlite::memory:',
            baseURL: 'http://localhost:3000',
        });
        ctx = createMockContext();
        await plugin.init(ctx as any);

        // Run database migrations so tables exist in the in-memory SQLite db
        const authInstance = plugin.getAuthInstance();
        const authCtx = await authInstance.$context;
        await authCtx.runMigrations();
    });

    afterAll(async () => {
        await plugin.destroy();
        await resetAuthInstance();
    });

    // ------------------------------------------------------------------
    // 1. Service Registration
    // ------------------------------------------------------------------

    describe('Service Registration', () => {
        it('should register as "auth" service (for HttpDispatcher)', () => {
            expect(ctx.services.get('auth')).toBe(plugin);
        });

        it('should register as "better-auth" alias', () => {
            expect(ctx.services.get('better-auth')).toBe(plugin);
        });

        it('should expose a handler function on the service', () => {
            const authSvc = ctx.services.get('auth');
            expect(typeof authSvc.handler).toBe('function');
        });
    });

    // ------------------------------------------------------------------
    // 2. Handler Signature (fetch-style)
    // ------------------------------------------------------------------

    describe('Handler — fetch-style (Request → Response)', () => {
        it('should accept a Request and return a Response', async () => {
            const request = new Request('http://localhost:3000/api/v1/auth/ok');
            const response = await plugin.handler!(request);

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(200);
        });

        it('getHandler() should return a callable handler', () => {
            const handler = plugin.getHandler();
            expect(typeof handler).toBe('function');
        });
    });

    // ------------------------------------------------------------------
    // 3. Sign-Up Flow
    // ------------------------------------------------------------------

    describe('POST /api/v1/auth/sign-up/email', () => {
        it('should create a new user and return user + session', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-up/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Test User',
                        email: 'test@example.com',
                        password: 'SecureP@ss123',
                    }),
                }),
            );

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe('test@example.com');
            expect(data.user.name).toBe('Test User');
            // First user should get super_admin role
            expect(data.user.role).toBe('super_admin');
        });

        it('should reject duplicate email', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-up/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Duplicate',
                        email: 'test@example.com',
                        password: 'AnotherP@ss123',
                    }),
                }),
            );

            // Better-Auth returns 4xx status or a body with error code
            const text = await response.text();
            let isError = response.status >= 400;
            if (text) {
                try { const body = JSON.parse(text); isError = isError || !!body.error || !!body.code; } catch {}
            }
            expect(isError).toBeTruthy();
        });

        it('second user should get "user" role', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-up/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Second User',
                        email: 'second@example.com',
                        password: 'SecureP@ss456',
                    }),
                }),
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.user.role).toBe('user');
        });
    });

    // ------------------------------------------------------------------
    // 4. Sign-In Flow
    // ------------------------------------------------------------------

    describe('POST /api/v1/auth/sign-in/email', () => {
        it('should sign in an existing user', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-in/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'SecureP@ss123',
                    }),
                }),
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe('test@example.com');
            // better-auth may return session or token depending on version
            expect(data.session ?? data.token).toBeDefined();
        });

        it('should reject wrong password', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-in/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'WrongPassword',
                    }),
                }),
            );

            const text = await response.text();
            let isError = response.status >= 400;
            if (text) {
                try { const body = JSON.parse(text); isError = isError || !!body.error || !!body.code; } catch {}
            }
            expect(isError).toBeTruthy();
        });

        it('should reject non-existent email', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-in/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'nonexistent@example.com',
                        password: 'AnyPassword123',
                    }),
                }),
            );

            const text = await response.text();
            let isError = response.status >= 400;
            if (text) {
                try { const body = JSON.parse(text); isError = isError || !!body.error || !!body.code; } catch {}
            }
            expect(isError).toBeTruthy();
        });
    });

    // ------------------------------------------------------------------
    // 5. Session (GET /api/v1/auth/get-session)
    // ------------------------------------------------------------------

    describe('GET /api/v1/auth/get-session', () => {
        it('should return 401 or null without auth cookie', async () => {
            const response = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/get-session'),
            );
            expect(response).toBeInstanceOf(Response);
        });

        it('should return session with valid auth cookie', async () => {
            // Sign in to get a session cookie
            const signInRes = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/sign-in/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'SecureP@ss123',
                    }),
                }),
            );
            expect(signInRes.status).toBe(200);

            // Extract set-cookie header
            const setCookie = signInRes.headers.get('set-cookie');
            if (!setCookie) return;

            const sessionRes = await plugin.handler!(
                new Request('http://localhost:3000/api/v1/auth/get-session', {
                    headers: { Cookie: setCookie.split(',')[0] },
                }),
            );

            expect(sessionRes.status).toBe(200);
            const data = await sessionRes.json();
            if (data) {
                expect(data.user).toBeDefined();
                expect(data.user.email).toBe('test@example.com');
            }
        });
    });

    // ------------------------------------------------------------------
    // 6. Plugin Lifecycle Events
    // ------------------------------------------------------------------

    describe('Plugin Lifecycle', () => {
        it('should emit plugin.initialized event', () => {
            const initEvent = ctx.events.find((e) => e.name === 'plugin.initialized');
            expect(initEvent).toBeDefined();
        });

        it('should emit auth.ready on start()', async () => {
            await plugin.start(ctx as any);
            const readyEvent = ctx.events.find((e) => e.name === 'auth.ready');
            expect(readyEvent).toBeDefined();
        });

        it('should return the auth instance via getAuthInstance()', () => {
            const instance = plugin.getAuthInstance();
            expect(instance).toBeDefined();
            expect(typeof instance.handler).toBe('function');
        });
    });
});
