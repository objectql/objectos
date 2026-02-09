/**
 * Tests for Audit Log Plugin
 */

import {
    AuditLogPlugin,
    getAuditLogAPI,
} from '../src/index.js';
import type { PluginContext } from '@objectstack/runtime';

// Mock context for testing
const createMockContext = (): { context: PluginContext; kernel: any; hooks: Map<string, Function[]> } => {
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

// Helper to trigger a hook
const triggerHook = async (hooks: Map<string, Function[]>, name: string, data: any) => {
    const handlers = hooks.get(name) || [];
    for (const handler of handlers) {
        await handler(data);
    }
};

describe('Audit Log Plugin', () => {
    let plugin: AuditLogPlugin;
    let mockContext: PluginContext;
    let mockKernel: any;
    let hooks: Map<string, Function[]>;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;
        hooks = mock.hooks;

        plugin = new AuditLogPlugin({
            enabled: true,
            trackFieldChanges: true,
        });
    });

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('@objectos/audit');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('audit-log', plugin);
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });

        it('should start successfully', async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Starting')
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Started successfully')
            );
        });

        it('should destroy successfully', async () => {
            await plugin.init(mockContext);
            await plugin.destroy();

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Destroyed')
            );
        });

        it('should register event hooks during init', async () => {
            await plugin.init(mockContext);

            expect(mockContext.hook).toHaveBeenCalledWith('data.create', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.update', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.delete', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.find', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('job.enqueued', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('job.started', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('job.completed', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('job.failed', expect.any(Function));
        });

        it('should create plugin with custom configuration', () => {
            const customPlugin = new AuditLogPlugin({
                enabled: true,
                trackFieldChanges: true,
                auditedObjects: ['users', 'orders'],
            });
            
            expect(customPlugin).toBeDefined();
            expect(customPlugin.name).toBe('@objectos/audit');
        });
    });

    describe('Audit Event Recording (审计事件记录)', () => {
        it('should record create events', async () => {
            await plugin.init(mockContext);
            
            const api = getAuditLogAPI(mockKernel);
            expect(api).toBeDefined();
            
            // Simulate a create event
            await triggerHook(hooks, 'data.create', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
                userName: 'John Doe',
                record: { id: '12345', status: 'new' },
            });
            
            // Query the event
            const events = await api!.queryEvents({ objectName: 'orders' });
            expect(events.length).toBeGreaterThan(0);
            expect(events[0].eventType).toBe('data.create');
            expect(events[0].resource).toContain('orders/12345');
        });

        it('should record update events with field changes', async () => {
            const customPlugin = new AuditLogPlugin({ trackFieldChanges: true });
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            // Simulate an update event
            await triggerHook(mock.hooks, 'data.update', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
                changes: {
                    status: { oldValue: 'new', newValue: 'processing' },
                    amount: { oldValue: 100, newValue: 150 },
                },
            });
            
            const trail = await api!.getAuditTrail('orders', '12345');
            expect(trail.length).toBeGreaterThan(0);
            
            const updateEvent = trail.find((e: any) => e.eventType === 'data.update');
            expect(updateEvent).toBeDefined();
            expect(updateEvent!.changes).toBeDefined();
            expect(updateEvent!.changes!.length).toBe(2);
        });

        it('should record delete events', async () => {
            await plugin.init(mockContext);
            
            const api = getAuditLogAPI(mockKernel);
            
            await triggerHook(hooks, 'data.delete', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
            });
            
            const events = await api!.queryEvents({ 
                objectName: 'orders',
                eventType: 'data.delete'
            });
            
            expect(events.length).toBeGreaterThan(0);
            expect(events[0].eventType).toBe('data.delete');
        });

        it('should exclude sensitive fields from audit', async () => {
            const customPlugin = new AuditLogPlugin({
                excludedFields: ['password', 'token'],
            });
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            await triggerHook(mock.hooks, 'data.update', {
                objectName: 'users',
                recordId: 'user123',
                userId: 'admin',
                changes: {
                    email: { oldValue: 'old@example.com', newValue: 'new@example.com' },
                    password: { oldValue: 'old_hash', newValue: 'new_hash' },
                },
            });
            
            const trail = await api!.getAuditTrail('users', 'user123');
            const updateEvent = trail[0];
            
            expect(updateEvent.changes).toBeDefined();
            expect(updateEvent.changes!.find((c: any) => c.field === 'email')).toBeDefined();
            expect(updateEvent.changes!.find((c: any) => c.field === 'password')).toBeUndefined();
        });
    });

    describe('Audit Tracking (审计跟踪)', () => {
        it('should query events by user', async () => {
            const customPlugin = new AuditLogPlugin({}); // Fresh instance with fresh storage
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            // Create events from different users
            await triggerHook(mock.hooks, 'data.create', {
                objectName: 'orders',
                recordId: '1',
                userId: 'user123',
            });
            
            await triggerHook(mock.hooks, 'data.create', {
                objectName: 'orders',
                recordId: '2',
                userId: 'user456',
            });
            
            const user123Events = await api!.queryEvents({ userId: 'user123' });
            expect(user123Events.length).toBe(1);
            expect(user123Events[0].userId).toBe('user123');
        });

        it('should query events by date range', async () => {
            const customPlugin = new AuditLogPlugin({}); // Fresh instance
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            await triggerHook(mock.hooks, 'data.create', {
                objectName: 'orders',
                recordId: '1',
                userId: 'user123',
            });
            
            const now = new Date();
            const startDate = new Date(now.getTime() - 1000).toISOString();
            const endDate = new Date(now.getTime() + 1000).toISOString();
            
            const events = await api!.queryEvents({ startDate, endDate });
            expect(events.length).toBeGreaterThan(0);
        });

        it('should support pagination', async () => {
            const customPlugin = new AuditLogPlugin({}); // Fresh instance
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            // Create multiple events
            for (let i = 0; i < 10; i++) {
                await triggerHook(mock.hooks, 'data.create', {
                    objectName: 'orders',
                    recordId: `${i}`,
                    userId: 'user123',
                });
            }
            
            const page1 = await api!.queryEvents({ limit: 5, offset: 0 });
            const page2 = await api!.queryEvents({ limit: 5, offset: 5 });
            
            expect(page1.length).toBe(5);
            expect(page2.length).toBe(5);
            expect(page1[0].id).not.toBe(page2[0].id);
        });
    });

    describe('Field History (字段历史)', () => {
        it('should track field history', async () => {
            const customPlugin = new AuditLogPlugin({}); // Fresh instance
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            // Update the same field multiple times
            await triggerHook(mock.hooks, 'data.update', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
                changes: {
                    status: { oldValue: 'new', newValue: 'processing' },
                },
            });
            
            await triggerHook(mock.hooks, 'data.update', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
                changes: {
                    status: { oldValue: 'processing', newValue: 'completed' },
                },
            });
            
            const history = await api!.getFieldHistory('orders', '12345', 'status');
            expect(history.length).toBe(2);
            expect(history[0].field).toBe('status');
            expect(history[1].field).toBe('status');
        });

        it('should get complete audit trail for a record', async () => {
            const customPlugin = new AuditLogPlugin({}); // Fresh instance
            const mock = createMockContext();
            await customPlugin.init(mock.context);
            
            const api = getAuditLogAPI(mock.kernel);
            
            // Create, update, and track a record
            await triggerHook(mock.hooks, 'data.create', {
                objectName: 'orders',
                recordId: '99999',
                userId: 'user123',
            });
            
            await triggerHook(mock.hooks, 'data.update', {
                objectName: 'orders',
                recordId: '99999',
                userId: 'user456',
                changes: {
                    status: { oldValue: 'new', newValue: 'processing' },
                },
            });
            
            const trail = await api!.getAuditTrail('orders', '99999');
            expect(trail.length).toBe(2);
            expect(trail.some((e: any) => e.eventType === 'data.create')).toBe(true);
            expect(trail.some((e: any) => e.eventType === 'data.update')).toBe(true);
        });
    });

    describe('API Access', () => {
        it('should provide API access helper', async () => {
            await plugin.init(mockContext);
            
            const api = getAuditLogAPI(mockKernel);
            expect(api).toBeDefined();
            expect(typeof api!.queryEvents).toBe('function');
            expect(typeof api!.getAuditTrail).toBe('function');
            expect(typeof api!.getFieldHistory).toBe('function');
        });

        it('should return null when plugin not registered', () => {
            const mock = createMockContext();
            // Mock getService to throw error
            mock.kernel.getService.mockImplementation(() => {
                throw new Error('Service not found');
            });
            
            const api = getAuditLogAPI(mock.kernel);
            expect(api).toBeNull();
        });
    });
});

// ─── Kernel Compliance Tests ───────────────────────────────────────────────────

describe('Kernel Compliance', () => {
    let plugin: AuditLogPlugin;

    beforeEach(async () => {
        plugin = new AuditLogPlugin();
        const mock = createMockContext();
        await plugin.init(mock.context);
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('healthCheck()', () => {
        it('should return healthy status when enabled', async () => {
            const report = await plugin.healthCheck();
            expect(report.status).toBe('healthy');
            expect(report.checks![0].name).toBe('audit-storage');
        });

        it('should return degraded when disabled', async () => {
            const disabledPlugin = new AuditLogPlugin({ enabled: false });
            const mock = createMockContext();
            await disabledPlugin.init(mock.context);
            const report = await disabledPlugin.healthCheck();
            expect(report.status).toBe('degraded');
        });
    });

    describe('getManifest()', () => {
        it('should declare audit services and events', () => {
            const manifest = plugin.getManifest();
            expect(manifest.capabilities.services).toContain('audit-log');
            expect(manifest.capabilities.emits).toContain('audit.event.recorded');
            expect(manifest.capabilities.listens).toContain('data.create');
            expect(manifest.security.handlesSensitiveData).toBe(true);
        });

        it('should declare full event type coverage', () => {
            const manifest = plugin.getManifest();
            const listens = manifest.capabilities.listens!;
            // Auth events
            expect(listens).toContain('auth.login');
            expect(listens).toContain('auth.logout');
            expect(listens).toContain('auth.session_created');
            expect(listens).toContain('auth.session_expired');
            expect(listens).toContain('auth.password_changed');
            // Authz events
            expect(listens).toContain('authz.permission_granted');
            expect(listens).toContain('authz.role_assigned');
            // System events
            expect(listens).toContain('system.config_changed');
            expect(listens).toContain('system.plugin_installed');
            // Security events
            expect(listens).toContain('security.access_denied');
            expect(listens).toContain('security.suspicious_activity');
        });
    });

    describe('getStartupResult()', () => {
        it('should return successful startup result', () => {
            const result = plugin.getStartupResult();
            expect(result.plugin.name).toBe('@objectos/audit');
            expect(result.success).toBe(true);
        });
    });
});

// ─── Auth/System/Security Event Coverage Tests ─────────────────────────────────

describe('Full Event Type Coverage', () => {
    it('should record auth events', async () => {
        const customPlugin = new AuditLogPlugin({});
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        await triggerHook(mock.hooks, 'auth.login', {
            userId: 'user123',
            userName: 'John',
            ipAddress: '192.168.1.1',
        });

        await triggerHook(mock.hooks, 'auth.logout', {
            userId: 'user123',
        });

        const events = await api!.queryEvents({});
        expect(events.length).toBe(2);
        expect(events.some((e: any) => e.eventType === 'auth.login')).toBe(true);
        expect(events.some((e: any) => e.eventType === 'auth.logout')).toBe(true);
    });

    it('should record security events', async () => {
        const customPlugin = new AuditLogPlugin({});
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        await triggerHook(mock.hooks, 'security.access_denied', {
            userId: 'user456',
            resource: '/admin/settings',
        });

        const events = await api!.queryEvents({});
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('security.access_denied');
        expect(events[0].success).toBe(false);
    });

    it('should record system events', async () => {
        const customPlugin = new AuditLogPlugin({});
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        await triggerHook(mock.hooks, 'system.config_changed', {
            userId: 'admin',
            resource: 'system.settings',
        });

        const events = await api!.queryEvents({});
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('system.config_changed');
    });

    it('should record authz events', async () => {
        const customPlugin = new AuditLogPlugin({});
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        await triggerHook(mock.hooks, 'authz.role_assigned', {
            userId: 'admin',
            resource: 'user:user123',
            role: 'editor',
        });

        const events = await api!.queryEvents({});
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('authz.role_assigned');
    });
});

// ─── Retention Policy Tests ────────────────────────────────────────────────────

describe('Retention Policy', () => {
    it('should delete expired events based on default retention days', async () => {
        const customPlugin = new AuditLogPlugin({
            retention: {
                enabled: true,
                defaultRetentionDays: 30,
            },
        });
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        // Create an event with a timestamp 60 days ago
        await triggerHook(mock.hooks, 'data.create', {
            objectName: 'orders',
            recordId: 'old-1',
            userId: 'user123',
        });

        // Manually set the event timestamp to 60 days ago
        const events = await api!.queryEvents({});
        const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        (events[0] as any).timestamp = oldDate;

        // Create a recent event
        await triggerHook(mock.hooks, 'data.create', {
            objectName: 'orders',
            recordId: 'new-1',
            userId: 'user123',
        });

        // Apply retention policy
        const deleted = await customPlugin.applyRetentionPolicy();
        expect(deleted).toBe(1);

        // Verify only the recent event remains
        const remaining = await api!.queryEvents({});
        expect(remaining.length).toBe(1);
    });

    it('should not delete events when retention is disabled', async () => {
        const customPlugin = new AuditLogPlugin({
            retention: {
                enabled: false,
                defaultRetentionDays: 1,
            },
        });
        const mock = createMockContext();
        await customPlugin.init(mock.context);

        const api = getAuditLogAPI(mock.kernel);

        await triggerHook(mock.hooks, 'data.create', {
            objectName: 'orders',
            recordId: '1',
            userId: 'user123',
        });

        const deleted = await customPlugin.applyRetentionPolicy();
        expect(deleted).toBe(0);

        const events = await api!.queryEvents({});
        expect(events.length).toBe(1);
    });

    it('should clean up retention timer on destroy', async () => {
        const customPlugin = new AuditLogPlugin({
            retention: {
                enabled: true,
                defaultRetentionDays: 30,
            },
        });
        const mock = createMockContext();
        await customPlugin.init(mock.context);
        await customPlugin.start(mock.context);

        // Destroy should not throw
        await customPlugin.destroy();
    });
});
