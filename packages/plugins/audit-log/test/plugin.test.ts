/**
 * Tests for Audit Log Plugin
 */

import {
    AuditLogPlugin,
    AuditLogManifest,
    createAuditLogPlugin,
    getAuditLogAPI,
} from '../src';
import type { PluginContextData } from '@objectstack/spec/system';

// Mock context for testing
const createMockContext = (): PluginContextData => {
    const eventHandlers: Map<string, Function[]> = new Map();
    
    const mockEventBus = {
        on: jest.fn((event: string, handler: Function) => {
            if (!eventHandlers.has(event)) {
                eventHandlers.set(event, []);
            }
            eventHandlers.get(event)!.push(handler);
        }),
        emit: jest.fn(async (event: string, data: any) => {
            const handlers = eventHandlers.get(event) || [];
            for (const handler of handlers) {
                await handler(data);
            }
        }),
    };
    
    return {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        },
        storage: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            has: jest.fn(),
        },
        app: {
            eventBus: mockEventBus,
        },
    } as any;
};

describe('Audit Log Plugin', () => {
    describe('Plugin Manifest', () => {
        it('should have correct manifest structure', () => {
            expect(AuditLogManifest).toBeDefined();
            expect(AuditLogManifest.id).toBe('com.objectos.audit-log');
            expect(AuditLogManifest.version).toBe('0.1.0');
            expect(AuditLogManifest.type).toBe('plugin');
            expect(AuditLogManifest.name).toBe('Audit Log Plugin');
        });

        it('should define required permissions', () => {
            expect(AuditLogManifest.permissions).toContain('system.audit.read');
            expect(AuditLogManifest.permissions).toContain('system.audit.write');
        });

        it('should define audit events', () => {
            const events = AuditLogManifest.contributes?.events || [];
            expect(events).toContain('audit.event.recorded');
            expect(events).toContain('audit.trail.created');
            expect(events).toContain('audit.field.changed');
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should export default plugin instance', () => {
            expect(AuditLogPlugin).toBeDefined();
            expect(typeof AuditLogPlugin).toBe('object');
        });

        it('should have all lifecycle hooks', () => {
            expect(typeof AuditLogPlugin.onInstall).toBe('function');
            expect(typeof AuditLogPlugin.onEnable).toBe('function');
            expect(typeof AuditLogPlugin.onDisable).toBe('function');
            expect(typeof AuditLogPlugin.onUninstall).toBe('function');
        });

        it('should create plugin with custom configuration', () => {
            const customPlugin = createAuditLogPlugin({
                enabled: true,
                trackFieldChanges: true,
                auditedObjects: ['users', 'orders'],
            });
            
            expect(customPlugin).toBeDefined();
            expect(customPlugin.onInstall).toBeDefined();
            expect(customPlugin.onEnable).toBeDefined();
        });

        it('should handle onInstall lifecycle', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onInstall!(context);
            
            expect(context.storage.set).toHaveBeenCalledWith('install_date', expect.any(String));
            expect(context.storage.set).toHaveBeenCalledWith('config', expect.any(String));
            expect(context.logger.info).toHaveBeenCalled();
        });

        it('should handle onEnable lifecycle', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onEnable!(context);
            
            expect(context.logger.info).toHaveBeenCalled();
            const eventBus = (context.app as any).eventBus;
            expect(eventBus.on).toHaveBeenCalled();
        });

        it('should handle onDisable lifecycle', async () => {
            const context = createMockContext();
            
            // Enable first
            await AuditLogPlugin.onEnable!(context);
            
            // Then disable
            await AuditLogPlugin.onDisable!(context);
            
            expect(context.storage.set).toHaveBeenCalledWith('last_disabled', expect.any(String));
            expect(context.logger.info).toHaveBeenCalled();
        });

        it('should handle onUninstall lifecycle', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onUninstall!(context);
            
            expect(context.storage.delete).toHaveBeenCalledWith('install_date');
            expect(context.storage.delete).toHaveBeenCalledWith('last_disabled');
            expect(context.storage.delete).toHaveBeenCalledWith('config');
        });
    });

    describe('Audit Event Recording (审计事件记录)', () => {
        it('should record create events', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            expect(api).toBeDefined();
            
            // Simulate a create event
            const eventBus = (context.app as any).eventBus;
            await eventBus.emit('data.create', {
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
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({ trackFieldChanges: true });
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            // Simulate an update event
            await (context.app as any).eventBus.emit('data.update', {
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
            
            const updateEvent = trail.find(e => e.eventType === 'data.update');
            expect(updateEvent).toBeDefined();
            expect(updateEvent!.changes).toBeDefined();
            expect(updateEvent!.changes!.length).toBe(2);
        });

        it('should record delete events', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            await (context.app as any).eventBus.emit('data.delete', {
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
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({
                excludedFields: ['password', 'token'],
            });
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            await (context.app as any).eventBus.emit('data.update', {
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
            expect(updateEvent.changes!.find(c => c.field === 'email')).toBeDefined();
            expect(updateEvent.changes!.find(c => c.field === 'password')).toBeUndefined();
        });
    });

    describe('Audit Tracking (审计跟踪)', () => {
        it('should query events by user', async () => {
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({}); // Fresh instance with fresh storage
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            // Create events from different users
            await (context.app as any).eventBus.emit('data.create', {
                objectName: 'orders',
                recordId: '1',
                userId: 'user123',
            });
            
            await (context.app as any).eventBus.emit('data.create', {
                objectName: 'orders',
                recordId: '2',
                userId: 'user456',
            });
            
            const user123Events = await api!.queryEvents({ userId: 'user123' });
            expect(user123Events.length).toBe(1);
            expect(user123Events[0].userId).toBe('user123');
        });

        it('should query events by date range', async () => {
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({}); // Fresh instance
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            await (context.app as any).eventBus.emit('data.create', {
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
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({}); // Fresh instance
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            // Create multiple events
            for (let i = 0; i < 10; i++) {
                await (context.app as any).eventBus.emit('data.create', {
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
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({}); // Fresh instance
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            // Update the same field multiple times
            await (context.app as any).eventBus.emit('data.update', {
                objectName: 'orders',
                recordId: '12345',
                userId: 'user123',
                changes: {
                    status: { oldValue: 'new', newValue: 'processing' },
                },
            });
            
            await (context.app as any).eventBus.emit('data.update', {
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
            const context = createMockContext();
            const customPlugin = createAuditLogPlugin({}); // Fresh instance
            await customPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            
            // Create, update, and track a record
            await (context.app as any).eventBus.emit('data.create', {
                objectName: 'orders',
                recordId: '99999',
                userId: 'user123',
            });
            
            await (context.app as any).eventBus.emit('data.update', {
                objectName: 'orders',
                recordId: '99999',
                userId: 'user456',
                changes: {
                    status: { oldValue: 'new', newValue: 'processing' },
                },
            });
            
            const trail = await api!.getAuditTrail('orders', '99999');
            expect(trail.length).toBe(2);
            expect(trail.some(e => e.eventType === 'data.create')).toBe(true);
            expect(trail.some(e => e.eventType === 'data.update')).toBe(true);
        });
    });

    describe('API Access', () => {
        it('should provide API access helper', async () => {
            const context = createMockContext();
            await AuditLogPlugin.onEnable!(context);
            
            const api = getAuditLogAPI(context.app);
            expect(api).toBeDefined();
            expect(typeof api!.queryEvents).toBe('function');
            expect(typeof api!.getAuditTrail).toBe('function');
            expect(typeof api!.getFieldHistory).toBe('function');
        });

        it('should return null when plugin not enabled', () => {
            const context = createMockContext();
            const api = getAuditLogAPI(context.app);
            expect(api).toBeNull();
        });
    });
});
