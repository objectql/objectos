/**
 * Integration Test Suite — Auth → Permissions → Data → Audit E2E
 *
 * Tests the full pipeline: a user authenticates, the permission layer
 * authorises the data operation, the data event fires, and the audit
 * plugin records the complete trail.
 *
 * All plugins run against the same mock kernel context so that hooks
 * propagate naturally through the chain.
 */

import { AuditLogPlugin, getAuditLogAPI } from '../src/index.js';
import { PermissionsPlugin } from '@objectos/permissions';
import type { PluginContext } from '@objectstack/runtime';

// ── Shared mock kernel context ─────────────────────────────────────────────────

const createMockContext = (): {
    context: PluginContext;
    kernel: any;
    hooks: Map<string, Function[]>;
} => {
    const hooks: Map<string, Function[]> = new Map();
    const kernel = {
        getService: jest.fn(),
        services: new Map(),
    };

    const context: PluginContext = {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        },
        registerService: jest.fn((name: string, service: any) => {
            kernel.services.set(name, service);
            kernel.getService.mockImplementation((n: string) => {
                if (kernel.services.has(n)) return kernel.services.get(n);
                throw new Error(`Service ${n} not found`);
            });
        }),
        getService: jest.fn((name: string) => {
            if (kernel.services.has(name)) return kernel.services.get(name);
            throw new Error(`Service ${name} not found`);
        }),
        hasService: jest.fn((name: string) => kernel.services.has(name)),
        getServices: jest.fn(() => kernel.services),
        hook: jest.fn((name: string, handler: Function) => {
            if (!hooks.has(name)) {
                hooks.set(name, []);
            }
            hooks.get(name)!.push(handler);
        }),
        trigger: jest.fn(async (name: string, ...args: any[]) => {
            const handlers = hooks.get(name) || [];
            for (const handler of handlers) {
                await handler(...args);
            }
        }),
        getKernel: jest.fn(() => kernel),
    } as any;

    return { context, kernel, hooks };
};

// Helper to fire hooks registered under a given name
const triggerHook = async (
    hooks: Map<string, Function[]>,
    name: string,
    data: any,
) => {
    const handlers = hooks.get(name) || [];
    for (const handler of handlers) {
        await handler(data);
    }
};

// ── Integration tests ──────────────────────────────────────────────────────────

describe('Integration: Auth → Permissions → Data → Audit', () => {
    let auditPlugin: AuditLogPlugin;
    let permissionsPlugin: PermissionsPlugin;
    let hooks: Map<string, Function[]>;
    let kernel: any;

    beforeEach(async () => {
        const mock = createMockContext();
        hooks = mock.hooks;
        kernel = mock.kernel;

        // Initialise plugins in the order the kernel would:
        // 1. Permissions first (registers data.before* hooks)
        permissionsPlugin = new PermissionsPlugin({ enabled: true, defaultDeny: false });
        await permissionsPlugin.init(mock.context);

        // 2. Audit second (registers data.* hooks)
        auditPlugin = new AuditLogPlugin({ enabled: true, trackFieldChanges: true });
        await auditPlugin.init(mock.context);
    });

    afterEach(async () => {
        await auditPlugin.destroy();
        await permissionsPlugin.destroy();
    });

    // ── Auth event → Audit trail ───────────────────────────────────────────────

    it('should record auth.login in audit trail', async () => {
        await triggerHook(hooks, 'auth.login', {
            userId: 'user-1',
            userName: 'Alice',
            ipAddress: '10.0.0.1',
            userAgent: 'test-agent',
        });

        const audit = getAuditLogAPI(kernel)!;
        const events = await audit.queryEvents({ userId: 'user-1' });

        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('auth.login');
        expect(events[0].userId).toBe('user-1');
        expect(events[0].ipAddress).toBe('10.0.0.1');
    });

    it('should record auth.login_failed as unsuccessful event', async () => {
        await triggerHook(hooks, 'auth.login_failed', {
            userId: 'attacker',
            ipAddress: '192.168.1.100',
        });

        const audit = getAuditLogAPI(kernel)!;
        const events = await audit.queryEvents({});
        expect(events[0].success).toBe(false);
    });

    // ── Permissions check → Data → Audit ───────────────────────────────────────

    it('should allow data.create and record audit event when permission granted', async () => {
        // Simulate a permitted data create operation
        // (defaultDeny=false means operations are allowed when no explicit deny)
        await triggerHook(hooks, 'data.beforeCreate', {
            objectName: 'accounts',
            userId: 'user-1',
            userProfiles: ['admin'],
            record: { id: 'acc-1', name: 'Acme Corp' },
        });

        // The data layer would now fire the post-operation event
        await triggerHook(hooks, 'data.create', {
            objectName: 'accounts',
            recordId: 'acc-1',
            userId: 'user-1',
            userName: 'Alice',
            record: { id: 'acc-1', name: 'Acme Corp' },
        });

        const audit = getAuditLogAPI(kernel)!;
        const events = await audit.queryEvents({ objectName: 'accounts' });
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('data.create');
        expect(events[0].resource).toContain('accounts/acc-1');
    });

    it('should allow data.update with field changes and record audit trail', async () => {
        // Pre-operation permission check
        await triggerHook(hooks, 'data.beforeUpdate', {
            objectName: 'accounts',
            userId: 'user-1',
            userProfiles: ['admin'],
            recordId: 'acc-1',
        });

        // Post-operation audit event
        await triggerHook(hooks, 'data.update', {
            objectName: 'accounts',
            recordId: 'acc-1',
            userId: 'user-1',
            userName: 'Alice',
            changes: {
                name: { oldValue: 'Acme Corp', newValue: 'Acme Inc' },
                status: { oldValue: 'active', newValue: 'suspended' },
            },
        });

        const audit = getAuditLogAPI(kernel)!;
        const trail = await audit.getAuditTrail('accounts', 'acc-1');
        expect(trail.length).toBe(1);
        expect(trail[0].eventType).toBe('data.update');
        expect(trail[0].changes).toBeDefined();
        expect(trail[0].changes!.length).toBe(2);
        expect(trail[0].changes!.map((c: any) => c.field).sort()).toEqual(['name', 'status']);
    });

    it('should allow data.delete and record audit event', async () => {
        await triggerHook(hooks, 'data.beforeDelete', {
            objectName: 'accounts',
            userId: 'user-1',
            userProfiles: ['admin'],
            recordId: 'acc-1',
        });

        await triggerHook(hooks, 'data.delete', {
            objectName: 'accounts',
            recordId: 'acc-1',
            userId: 'user-1',
        });

        const audit = getAuditLogAPI(kernel)!;
        const events = await audit.queryEvents({
            objectName: 'accounts',
            eventType: 'data.delete',
        });
        expect(events.length).toBe(1);
    });

    // ── Complete lifecycle: login → create → update → delete → audit ───────────

    it('should trace a full CRUD lifecycle in audit', async () => {
        const audit = getAuditLogAPI(kernel)!;

        // 1. Login
        await triggerHook(hooks, 'auth.login', {
            userId: 'user-1',
            userName: 'Alice',
            ipAddress: '10.0.0.1',
        });

        // 2. Create
        await triggerHook(hooks, 'data.beforeCreate', {
            objectName: 'orders',
            userId: 'user-1',
            userProfiles: ['admin'],
        });
        await triggerHook(hooks, 'data.create', {
            objectName: 'orders',
            recordId: 'ord-1',
            userId: 'user-1',
            record: { id: 'ord-1', total: 100 },
        });

        // 3. Update
        await triggerHook(hooks, 'data.beforeUpdate', {
            objectName: 'orders',
            userId: 'user-1',
            userProfiles: ['admin'],
        });
        await triggerHook(hooks, 'data.update', {
            objectName: 'orders',
            recordId: 'ord-1',
            userId: 'user-1',
            changes: { total: { oldValue: 100, newValue: 200 } },
        });

        // 4. Delete
        await triggerHook(hooks, 'data.beforeDelete', {
            objectName: 'orders',
            userId: 'user-1',
            userProfiles: ['admin'],
        });
        await triggerHook(hooks, 'data.delete', {
            objectName: 'orders',
            recordId: 'ord-1',
            userId: 'user-1',
        });

        // 5. Logout
        await triggerHook(hooks, 'auth.logout', { userId: 'user-1' });

        // Verify: 5 audit events (login, create, update, delete, logout)
        const allEvents = await audit.queryEvents({});
        expect(allEvents.length).toBe(5);

        const types = allEvents.map((e: any) => e.eventType);
        expect(types).toContain('auth.login');
        expect(types).toContain('data.create');
        expect(types).toContain('data.update');
        expect(types).toContain('data.delete');
        expect(types).toContain('auth.logout');

        // Verify record-specific audit trail
        const orderTrail = await audit.getAuditTrail('orders', 'ord-1');
        expect(orderTrail.length).toBe(3); // create, update, delete

        // Verify field history
        const totalHistory = await audit.getFieldHistory('orders', 'ord-1', 'total');
        expect(totalHistory.length).toBe(1);
        expect(totalHistory[0].oldValue).toBe(100);
        expect(totalHistory[0].newValue).toBe(200);
    });

    // ── Permission denied → security event ─────────────────────────────────────

    it('should record security.access_denied when permission is denied', async () => {
        const audit = getAuditLogAPI(kernel)!;

        await triggerHook(hooks, 'security.access_denied', {
            userId: 'user-2',
            resource: 'accounts',
            action: 'delete',
            ipAddress: '10.0.0.2',
        });

        const events = await audit.queryEvents({});
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('security.access_denied');
        expect(events[0].success).toBe(false);
    });

    // ── Authorization events → audit ───────────────────────────────────────────

    it('should record role assignment in audit trail', async () => {
        const audit = getAuditLogAPI(kernel)!;

        await triggerHook(hooks, 'authz.role_assigned', {
            userId: 'admin-1',
            resource: 'user:user-2',
            role: 'editor',
        });

        await triggerHook(hooks, 'authz.permission_granted', {
            userId: 'admin-1',
            resource: 'user:user-2',
            permission: 'accounts.create',
        });

        const events = await audit.queryEvents({});
        expect(events.length).toBe(2);
        expect(events.some((e: any) => e.eventType === 'authz.role_assigned')).toBe(true);
        expect(events.some((e: any) => e.eventType === 'authz.permission_granted')).toBe(true);
    });

    // ── Sensitive field exclusion across pipeline ──────────────────────────────

    it('should exclude sensitive fields from audit across the full pipeline', async () => {
        // Create a custom audit plugin that excludes password and token
        const mock2 = createMockContext();
        const audit2 = new AuditLogPlugin({
            enabled: true,
            trackFieldChanges: true,
            excludedFields: ['password', 'token', 'secret'],
        });
        const perm2 = new PermissionsPlugin({ enabled: true, defaultDeny: false });
        await perm2.init(mock2.context);
        await audit2.init(mock2.context);

        // Simulate user update with sensitive fields
        await triggerHook(mock2.hooks, 'data.beforeUpdate', {
            objectName: 'users',
            userId: 'admin-1',
            userProfiles: ['admin'],
        });
        await triggerHook(mock2.hooks, 'data.update', {
            objectName: 'users',
            recordId: 'user-2',
            userId: 'admin-1',
            changes: {
                email: { oldValue: 'old@example.com', newValue: 'new@example.com' },
                password: { oldValue: 'hash1', newValue: 'hash2' },
                token: { oldValue: 'tok1', newValue: 'tok2' },
            },
        });

        const auditApi = getAuditLogAPI(mock2.kernel)!;
        const trail = await auditApi.getAuditTrail('users', 'user-2');
        expect(trail.length).toBe(1);
        const fields = trail[0].changes!.map((c: any) => c.field);
        expect(fields).toContain('email');
        expect(fields).not.toContain('password');
        expect(fields).not.toContain('token');

        await audit2.destroy();
        await perm2.destroy();
    });
});
