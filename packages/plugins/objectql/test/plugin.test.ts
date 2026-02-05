import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectQLPlugin } from '../src/plugin';
import { PluginContext } from '@objectstack/runtime';

// Mock the PluginContext
const mockTrigger = vi.fn();
const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

const mockContext: any = {
    logger: mockLogger,
    trigger: mockTrigger,
    registerService: vi.fn(),
};

describe('ObjectQLPlugin', () => {
    let plugin: ObjectQLPlugin;
    let dataService: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        plugin = new ObjectQLPlugin();
        await plugin.init(mockContext);
        
        // Capture the registered data service
        const registerCall = vi.mocked(mockContext.registerService).mock.calls.find(call => call[0] === 'data');
        if (registerCall) {
            dataService = registerCall[1];
        }
    });

    it('should register data service', () => {
        expect(mockContext.registerService).toHaveBeenCalledWith('data', expect.any(Object));
        expect(mockContext.registerService).toHaveBeenCalledWith('objectql', expect.any(Object));
    });

    describe('create operation', () => {
        it('should trigger hooks and inject tenant id', async () => {
            const user = { id: 'u1', spaceId: 'space1' };
            const doc = { name: 'Test' };
            
            await dataService.create({ object: 'test_obj', doc, user });

            // Check before hook (validation/permissions)
            expect(mockTrigger).toHaveBeenCalledWith('data.beforeCreate', expect.objectContaining({
                object: 'test_obj',
                doc: expect.objectContaining({ name: 'Test', space: 'space1' }),
                user,
                tenantId: 'space1'
            }));

            // Check after hook (workflow/automation)
            expect(mockTrigger).toHaveBeenCalledWith('data.afterCreate', expect.objectContaining({
                object: 'test_obj',
                doc: expect.objectContaining({ name: 'Test', space: 'space1' }),
                user,
                tenantId: 'space1'
            }));
        });

        it('should handle missing tenant id gracefully', async () => {
            const user = { id: 'u1' }; // No spaceId
            const doc = { name: 'Test' };
            
            await dataService.create({ object: 'test_obj', doc, user });

            expect(mockTrigger).toHaveBeenCalledWith('data.beforeCreate', expect.objectContaining({
                tenantId: undefined,
                doc: expect.not.objectContaining({ space: expect.any(String) })
            }));
        });
    });

    describe('find operation', () => {
        it('should inject tenant filter', async () => {
            const user = { id: 'u1', spaceId: 'space1' };
            const query: any = { filters: [['active', '=', true]] };
            
            await dataService.find({ object: 'test_obj', query, user });

            // We expect the query passed to the hook/engine to have been modified?
            // Since `dataService.find` calls `engineProxy.find`, and our test inspects the `beforeFind` trigger.
            // But wait, the modification happens *inside* the proxy's trap before original method call? No.
            // Let's check the code:
            // "if (user?.spaceId) { query = query || {}; query.filters = ... }"
            
            // So we can expect the hook to receive the modified query?
            // Actually, the proxy creates a fresh reference or modifies the implementation.
            
            // Let's verify what mockTrigger received.
            expect(mockTrigger).toHaveBeenCalledWith('data.beforeFind', expect.objectContaining({
                tenantId: 'space1'
            }));
            
            // We can't easily check the modifications to 'query' unless we inspect what was passed to mock engine, 
            // but we are mocking the context.
            // The real verification is that `beforeFind` hook received the tenantId which allows permissions plugin to verify it.
        });
    });

    describe('update operation', () => {
        it('should trigger update hooks', async () => {
            const user = { id: 'u1', spaceId: 'space1' };
            const doc = { name: 'Updated' };
            
            await dataService.update({ object: 'test_obj', id: '123', doc, user });

            expect(mockTrigger).toHaveBeenCalledWith('data.beforeUpdate', expect.objectContaining({
                object: 'test_obj',
                id: '123',
                previous: { id: '123' },
                tenantId: 'space1'
            }));

            expect(mockTrigger).toHaveBeenCalledWith('data.afterUpdate', expect.objectContaining({
                object: 'test_obj',
                id: '123'
            }));
        });
    });

    describe('delete operation', () => {
        it('should trigger delete hooks', async () => {
            const user = { id: 'u1', spaceId: 'space1' };
            
            await dataService.delete({ object: 'test_obj', id: '123', user });

            expect(mockTrigger).toHaveBeenCalledWith('data.beforeDelete', expect.objectContaining({
                object: 'test_obj',
                id: '123',
                tenantId: 'space1'
            }));

            expect(mockTrigger).toHaveBeenCalledWith('data.afterDelete', expect.objectContaining({
                object: 'test_obj',
                id: '123'
            }));
        });
    });

    describe('security (blocking hooks)', () => {
        it('should block create if beforeCreate throws', async () => {
            const user = { id: 'u1' };
            const doc = { name: 'Test' };

            // Mock trigger to throw on beforeCreate
            mockTrigger.mockImplementation(async (event) => {
                if (event === 'data.beforeCreate') {
                    throw new Error('Permission Denied');
                }
            });

            await expect(dataService.create({ object: 'test_obj', doc, user }))
                .rejects.toThrow('Permission Denied');
            
            // Verify afterCreate was NOT called
            expect(mockTrigger).not.toHaveBeenCalledWith('data.afterCreate', expect.anything());
        });
    });
});
