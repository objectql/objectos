/**
 * Kernel Context Tests
 */

import { createKernelContext, KernelContextManager } from '../src/kernel-context';

describe('KernelContext', () => {
    describe('createKernelContext', () => {
        it('should create context with default values', () => {
            const context = createKernelContext();
            
            expect(context.instanceId).toBeDefined();
            expect(context.mode).toBe('development');
            expect(context.version).toBeDefined();
            expect(context.cwd).toBeDefined();
            expect(context.startTime).toBeDefined();
            expect(context.features).toEqual({});
        });

        it('should create context with custom values', () => {
            const context = createKernelContext({
                mode: 'production',
                version: '1.0.0',
                appName: 'TestApp',
                features: { testFeature: true },
            });
            
            expect(context.mode).toBe('production');
            expect(context.version).toBe('1.0.0');
            expect(context.appName).toBe('TestApp');
            expect(context.features.testFeature).toBe(true);
        });
    });

    describe('KernelContextManager', () => {
        it('should manage kernel context', () => {
            const manager = new KernelContextManager({ mode: 'test' });
            const context = manager.getContext();
            
            expect(context.mode).toBe('test');
        });

        it('should get instance ID', () => {
            const manager = new KernelContextManager();
            const instanceId = manager.getInstanceId();
            
            expect(instanceId).toBeDefined();
            expect(typeof instanceId).toBe('string');
        });

        it('should manage feature flags', () => {
            const manager = new KernelContextManager();
            
            expect(manager.isFeatureEnabled('testFeature')).toBe(false);
            
            manager.enableFeature('testFeature');
            expect(manager.isFeatureEnabled('testFeature')).toBe(true);
            
            manager.disableFeature('testFeature');
            expect(manager.isFeatureEnabled('testFeature')).toBe(false);
        });

        it('should calculate uptime', async () => {
            const manager = new KernelContextManager();
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const uptime = manager.getUptime();
            expect(uptime).toBeGreaterThan(0);
        });
    });
});
