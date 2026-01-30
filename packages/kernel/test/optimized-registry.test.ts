/**
 * OptimizedRegistry Tests
 * 
 * Comprehensive test suite for the high-performance service registry
 * with O(1) lookups and multi-index support.
 */

import { OptimizedRegistry, ServiceMetadata } from '../src/optimized-registry';

describe('OptimizedRegistry', () => {
    let registry: OptimizedRegistry;

    beforeEach(() => {
        registry = new OptimizedRegistry();
    });

    const createService = (
        id: string,
        overrides?: Partial<Omit<ServiceMetadata, 'registeredAt'>>
    ): Omit<ServiceMetadata, 'registeredAt'> => ({
        id,
        name: `Service ${id}`,
        type: 'test-service',
        providedBy: 'test-plugin',
        implementation: { mock: true },
        ...overrides,
    });

    describe('Service registration', () => {
        it('should register a service', () => {
            const service = createService('service-1');
            registry.register(service);
            
            const retrieved = registry.get('service-1');
            expect(retrieved).toBeDefined();
            expect(retrieved!.id).toBe('service-1');
            expect(retrieved!.name).toBe('Service service-1');
        });

        it('should add registration timestamp', () => {
            const before = new Date();
            const service = createService('service-1');
            registry.register(service);
            const after = new Date();
            
            const retrieved = registry.get('service-1');
            expect(retrieved!.registeredAt).toBeDefined();
            expect(retrieved!.registeredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(retrieved!.registeredAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should register service with all metadata fields', () => {
            const service = createService('service-1', {
                version: '1.0.0',
                tags: ['api', 'rest'],
                dependencies: ['dep1', 'dep2'],
                metadata: { custom: 'data' },
            });
            
            registry.register(service);
            
            const retrieved = registry.get('service-1');
            expect(retrieved!.version).toBe('1.0.0');
            expect(retrieved!.tags).toEqual(['api', 'rest']);
            expect(retrieved!.dependencies).toEqual(['dep1', 'dep2']);
            expect(retrieved!.metadata).toEqual({ custom: 'data' });
        });

        it('should replace existing service on duplicate registration', () => {
            const service1 = createService('service-1', { name: 'First' });
            const service2 = createService('service-1', { name: 'Second' });
            
            registry.register(service1);
            registry.register(service2);
            
            const retrieved = registry.get('service-1');
            expect(retrieved!.name).toBe('Second');
        });

        it('should update registration count', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            
            const stats = registry.getStats();
            expect(stats.registrationCount).toBe(2);
        });

        it('should handle service with no optional fields', () => {
            const service = createService('service-1');
            delete service.version;
            delete service.tags;
            delete service.dependencies;
            delete service.metadata;
            
            registry.register(service);
            
            const retrieved = registry.get('service-1');
            expect(retrieved).toBeDefined();
        });
    });

    describe('Service unregistration', () => {
        it('should unregister a service', () => {
            registry.register(createService('service-1'));
            
            const result = registry.unregister('service-1');
            
            expect(result).toBe(true);
            expect(registry.get('service-1')).toBeUndefined();
        });

        it('should return false for non-existent service', () => {
            const result = registry.unregister('non-existent');
            expect(result).toBe(false);
        });

        it('should remove service from all indexes', () => {
            const service = createService('service-1', {
                type: 'api',
                providedBy: 'plugin1',
                tags: ['tag1', 'tag2'],
                name: 'TestService',
            });
            
            registry.register(service);
            registry.unregister('service-1');
            
            expect(registry.findByType('api')).toHaveLength(0);
            expect(registry.findByProvider('plugin1')).toHaveLength(0);
            expect(registry.findByTag('tag1')).toHaveLength(0);
            expect(registry.findByTag('tag2')).toHaveLength(0);
            expect(registry.findByName('TestService')).toHaveLength(0);
        });

        it('should not affect other services when unregistering', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            
            registry.unregister('service-1');
            
            expect(registry.get('service-2')).toBeDefined();
        });
    });

    describe('Service lookup by ID (O(1))', () => {
        it('should get service by ID', () => {
            registry.register(createService('service-1'));
            
            const service = registry.get('service-1');
            expect(service).toBeDefined();
            expect(service!.id).toBe('service-1');
        });

        it('should return undefined for non-existent service', () => {
            const service = registry.get('non-existent');
            expect(service).toBeUndefined();
        });

        it('should get implementation by ID', () => {
            const impl = { method: () => 'test' };
            registry.register(createService('service-1', { implementation: impl }));
            
            const retrieved = registry.getImplementation('service-1');
            expect(retrieved).toBe(impl);
        });

        it('should return undefined for non-existent implementation', () => {
            const impl = registry.getImplementation('non-existent');
            expect(impl).toBeUndefined();
        });

        it('should check service existence', () => {
            registry.register(createService('service-1'));
            
            expect(registry.has('service-1')).toBe(true);
            expect(registry.has('non-existent')).toBe(false);
        });

        it('should increment lookup count', () => {
            registry.register(createService('service-1'));
            
            registry.get('service-1');
            registry.get('service-1');
            registry.has('service-1');
            
            const stats = registry.getStats();
            expect(stats.lookupCount).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Service lookup by type (indexed)', () => {
        it('should find services by type', () => {
            registry.register(createService('service-1', { type: 'api' }));
            registry.register(createService('service-2', { type: 'api' }));
            registry.register(createService('service-3', { type: 'worker' }));
            
            const apiServices = registry.findByType('api');
            expect(apiServices).toHaveLength(2);
            expect(apiServices.map(s => s.id)).toContain('service-1');
            expect(apiServices.map(s => s.id)).toContain('service-2');
        });

        it('should return empty array for non-existent type', () => {
            const services = registry.findByType('non-existent');
            expect(services).toEqual([]);
        });

        it('should update type index on service update', () => {
            registry.register(createService('service-1', { type: 'api' }));
            registry.register(createService('service-1', { type: 'worker' }));
            
            expect(registry.findByType('api')).toHaveLength(0);
            expect(registry.findByType('worker')).toHaveLength(1);
        });

        it('should handle multiple services of same type', () => {
            for (let i = 0; i < 10; i++) {
                registry.register(createService(`service-${i}`, { type: 'bulk' }));
            }
            
            const services = registry.findByType('bulk');
            expect(services).toHaveLength(10);
        });
    });

    describe('Service lookup by provider (indexed)', () => {
        it('should find services by provider', () => {
            registry.register(createService('service-1', { providedBy: 'plugin1' }));
            registry.register(createService('service-2', { providedBy: 'plugin1' }));
            registry.register(createService('service-3', { providedBy: 'plugin2' }));
            
            const plugin1Services = registry.findByProvider('plugin1');
            expect(plugin1Services).toHaveLength(2);
            expect(plugin1Services.map(s => s.id)).toContain('service-1');
            expect(plugin1Services.map(s => s.id)).toContain('service-2');
        });

        it('should return empty array for non-existent provider', () => {
            const services = registry.findByProvider('non-existent');
            expect(services).toEqual([]);
        });

        it('should update provider index on service update', () => {
            registry.register(createService('service-1', { providedBy: 'plugin1' }));
            registry.register(createService('service-1', { providedBy: 'plugin2' }));
            
            expect(registry.findByProvider('plugin1')).toHaveLength(0);
            expect(registry.findByProvider('plugin2')).toHaveLength(1);
        });
    });

    describe('Service lookup by tag (indexed)', () => {
        it('should find services by tag', () => {
            registry.register(createService('service-1', { tags: ['api', 'rest'] }));
            registry.register(createService('service-2', { tags: ['api', 'graphql'] }));
            registry.register(createService('service-3', { tags: ['worker'] }));
            
            const apiServices = registry.findByTag('api');
            expect(apiServices).toHaveLength(2);
        });

        it('should return empty array for non-existent tag', () => {
            const services = registry.findByTag('non-existent');
            expect(services).toEqual([]);
        });

        it('should handle services with no tags', () => {
            registry.register(createService('service-1'));
            
            const services = registry.findByTag('any-tag');
            expect(services).toHaveLength(0);
        });

        it('should handle service with multiple tags', () => {
            const service = createService('service-1', { tags: ['tag1', 'tag2', 'tag3'] });
            registry.register(service);
            
            expect(registry.findByTag('tag1')).toHaveLength(1);
            expect(registry.findByTag('tag2')).toHaveLength(1);
            expect(registry.findByTag('tag3')).toHaveLength(1);
        });

        it('should update tag index when service is replaced', () => {
            registry.register(createService('service-1', { tags: ['old'] }));
            registry.register(createService('service-1', { tags: ['new'] }));
            
            expect(registry.findByTag('old')).toHaveLength(0);
            expect(registry.findByTag('new')).toHaveLength(1);
        });
    });

    describe('Service lookup by name (indexed)', () => {
        it('should find services by name', () => {
            registry.register(createService('service-1', { name: 'UserService' }));
            registry.register(createService('service-2', { name: 'UserService' }));
            registry.register(createService('service-3', { name: 'OrderService' }));
            
            const userServices = registry.findByName('UserService');
            expect(userServices).toHaveLength(2);
        });

        it('should return empty array for non-existent name', () => {
            const services = registry.findByName('non-existent');
            expect(services).toEqual([]);
        });

        it('should be case-sensitive', () => {
            registry.register(createService('service-1', { name: 'UserService' }));
            
            expect(registry.findByName('UserService')).toHaveLength(1);
            expect(registry.findByName('userservice')).toHaveLength(0);
        });
    });

    describe('Multi-criteria query', () => {
        beforeEach(() => {
            registry.register(createService('service-1', {
                type: 'api',
                providedBy: 'plugin1',
                tags: ['rest', 'v1'],
            }));
            
            registry.register(createService('service-2', {
                type: 'api',
                providedBy: 'plugin1',
                tags: ['graphql', 'v2'],
            }));
            
            registry.register(createService('service-3', {
                type: 'worker',
                providedBy: 'plugin2',
                tags: ['background'],
            }));
        });

        it('should query by type', () => {
            const results = registry.query({ type: 'api' });
            expect(results).toHaveLength(2);
        });

        it('should query by provider', () => {
            const results = registry.query({ providedBy: 'plugin1' });
            expect(results).toHaveLength(2);
        });

        it('should query by tags', () => {
            const results = registry.query({ tags: ['rest'] });
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('service-1');
        });

        it('should query by type and provider', () => {
            const results = registry.query({ type: 'api', providedBy: 'plugin1' });
            expect(results).toHaveLength(2);
        });

        it('should query by type and tags', () => {
            const results = registry.query({ type: 'api', tags: ['rest'] });
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('service-1');
        });

        it('should query by multiple tags (AND logic)', () => {
            const results = registry.query({ tags: ['rest', 'v1'] });
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('service-1');
        });

        it('should query with all criteria', () => {
            const results = registry.query({
                type: 'api',
                providedBy: 'plugin1',
                tags: ['rest', 'v1'],
            });
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('service-1');
        });

        it('should return empty array when no matches', () => {
            const results = registry.query({
                type: 'api',
                tags: ['non-existent'],
            });
            expect(results).toEqual([]);
        });

        it('should return all services with empty query', () => {
            const results = registry.query({});
            expect(results).toHaveLength(3);
        });

        it('should optimize query with smallest index', () => {
            // Register many services to test optimization
            for (let i = 4; i <= 100; i++) {
                registry.register(createService(`service-${i}`, {
                    type: 'common',
                    tags: i === 50 ? ['rare'] : ['common'],
                }));
            }
            
            // Query with rare tag should be faster
            const results = registry.query({ tags: ['rare'] });
            expect(results).toHaveLength(1);
        });
    });

    describe('Batch operations', () => {
        it('should batch register services', () => {
            const services = [
                createService('service-1'),
                createService('service-2'),
                createService('service-3'),
            ];
            
            registry.registerBatch(services);
            
            expect(registry.get('service-1')).toBeDefined();
            expect(registry.get('service-2')).toBeDefined();
            expect(registry.get('service-3')).toBeDefined();
        });

        it('should batch unregister services', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            registry.register(createService('service-3'));
            
            const count = registry.unregisterBatch(['service-1', 'service-2']);
            
            expect(count).toBe(2);
            expect(registry.get('service-1')).toBeUndefined();
            expect(registry.get('service-2')).toBeUndefined();
            expect(registry.get('service-3')).toBeDefined();
        });

        it('should handle batch unregister with non-existent IDs', () => {
            registry.register(createService('service-1'));
            
            const count = registry.unregisterBatch(['service-1', 'non-existent', 'also-non-existent']);
            
            expect(count).toBe(1);
        });

        it('should batch register many services efficiently', () => {
            const services = Array.from({ length: 1000 }, (_, i) => 
                createService(`service-${i}`, { type: `type-${i % 10}` })
            );
            
            const start = performance.now();
            registry.registerBatch(services);
            const duration = performance.now() - start;
            
            expect(registry.getAll()).toHaveLength(1000);
            expect(duration).toBeLessThan(100); // Should be fast
        });
    });

    describe('Statistics', () => {
        it('should track total services', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            
            const stats = registry.getStats();
            expect(stats.totalServices).toBe(2);
        });

        it('should track total types', () => {
            registry.register(createService('service-1', { type: 'type1' }));
            registry.register(createService('service-2', { type: 'type2' }));
            registry.register(createService('service-3', { type: 'type1' }));
            
            const stats = registry.getStats();
            expect(stats.totalTypes).toBe(2);
        });

        it('should track total providers', () => {
            registry.register(createService('service-1', { providedBy: 'plugin1' }));
            registry.register(createService('service-2', { providedBy: 'plugin2' }));
            
            const stats = registry.getStats();
            expect(stats.totalProviders).toBe(2);
        });

        it('should track total tags', () => {
            registry.register(createService('service-1', { tags: ['tag1', 'tag2'] }));
            registry.register(createService('service-2', { tags: ['tag2', 'tag3'] }));
            
            const stats = registry.getStats();
            expect(stats.totalTags).toBe(3);
        });

        it('should track lookup count', () => {
            registry.register(createService('service-1'));
            
            registry.get('service-1');
            registry.findByType('test-service');
            
            const stats = registry.getStats();
            expect(stats.lookupCount).toBeGreaterThanOrEqual(2);
        });

        it('should track registration count', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            
            const stats = registry.getStats();
            expect(stats.registrationCount).toBe(2);
        });
    });

    describe('Get all services', () => {
        it('should get all registered services', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            registry.register(createService('service-3'));
            
            const all = registry.getAll();
            expect(all).toHaveLength(3);
        });

        it('should return empty array when no services', () => {
            const all = registry.getAll();
            expect(all).toEqual([]);
        });
    });

    describe('Get types and tags', () => {
        it('should get all types', () => {
            registry.register(createService('service-1', { type: 'type1' }));
            registry.register(createService('service-2', { type: 'type2' }));
            registry.register(createService('service-3', { type: 'type1' }));
            
            const types = registry.getTypes();
            expect(types).toHaveLength(2);
            expect(types).toContain('type1');
            expect(types).toContain('type2');
        });

        it('should get all tags', () => {
            registry.register(createService('service-1', { tags: ['tag1', 'tag2'] }));
            registry.register(createService('service-2', { tags: ['tag2', 'tag3'] }));
            
            const tags = registry.getTags();
            expect(tags).toHaveLength(3);
            expect(tags).toContain('tag1');
            expect(tags).toContain('tag2');
            expect(tags).toContain('tag3');
        });
    });

    describe('Clear registry', () => {
        it('should clear all services', () => {
            registry.register(createService('service-1'));
            registry.register(createService('service-2'));
            
            registry.clear();
            
            expect(registry.getAll()).toHaveLength(0);
        });

        it('should clear all indexes', () => {
            registry.register(createService('service-1', {
                type: 'api',
                providedBy: 'plugin1',
                tags: ['tag1'],
                name: 'TestService',
            }));
            
            registry.clear();
            
            expect(registry.findByType('api')).toHaveLength(0);
            expect(registry.findByProvider('plugin1')).toHaveLength(0);
            expect(registry.findByTag('tag1')).toHaveLength(0);
            expect(registry.findByName('TestService')).toHaveLength(0);
        });

        it('should reset counters', () => {
            registry.register(createService('service-1'));
            registry.get('service-1');
            
            registry.clear();
            
            const stats = registry.getStats();
            expect(stats.totalServices).toBe(0);
            expect(stats.lookupCount).toBe(0);
            expect(stats.registrationCount).toBe(0);
        });

        it('should allow registration after clear', () => {
            registry.register(createService('service-1'));
            registry.clear();
            registry.register(createService('service-2'));
            
            expect(registry.get('service-1')).toBeUndefined();
            expect(registry.get('service-2')).toBeDefined();
        });
    });

    describe('Edge cases', () => {
        describe('duplicate handling', () => {
            it('should replace duplicate service completely', () => {
                registry.register(createService('service-1', {
                    type: 'old-type',
                    tags: ['old-tag'],
                }));
                
                registry.register(createService('service-1', {
                    type: 'new-type',
                    tags: ['new-tag'],
                }));
                
                const service = registry.get('service-1');
                expect(service!.type).toBe('new-type');
                expect(service!.tags).toEqual(['new-tag']);
            });

            it('should not duplicate in indexes', () => {
                registry.register(createService('service-1', { type: 'api' }));
                registry.register(createService('service-1', { type: 'api' }));
                
                const services = registry.findByType('api');
                expect(services).toHaveLength(1);
            });
        });

        describe('missing services', () => {
            it('should handle get on empty registry', () => {
                expect(registry.get('any-id')).toBeUndefined();
            });

            it('should handle unregister on empty registry', () => {
                expect(registry.unregister('any-id')).toBe(false);
            });

            it('should handle query on empty registry', () => {
                const results = registry.query({ type: 'any' });
                expect(results).toEqual([]);
            });
        });

        describe('special characters in IDs and names', () => {
            it('should handle special characters in service ID', () => {
                const service = createService('service-@#$%', { name: 'Special' });
                registry.register(service);
                
                expect(registry.get('service-@#$%')).toBeDefined();
            });

            it('should handle special characters in tags', () => {
                const service = createService('service-1', { tags: ['tag-with-dash', 'tag_with_underscore'] });
                registry.register(service);
                
                expect(registry.findByTag('tag-with-dash')).toHaveLength(1);
                expect(registry.findByTag('tag_with_underscore')).toHaveLength(1);
            });
        });

        describe('large datasets', () => {
            it('should handle large number of services', () => {
                const count = 10000;
                for (let i = 0; i < count; i++) {
                    registry.register(createService(`service-${i}`));
                }
                
                expect(registry.getAll()).toHaveLength(count);
            });

            it('should maintain O(1) lookup with many services', () => {
                for (let i = 0; i < 10000; i++) {
                    registry.register(createService(`service-${i}`));
                }
                
                const start = performance.now();
                registry.get('service-5000');
                const duration = performance.now() - start;
                
                // Should be extremely fast (< 0.001ms typically)
                expect(duration).toBeLessThan(1);
            });

            it('should handle many tags efficiently', () => {
                for (let i = 0; i < 1000; i++) {
                    registry.register(createService(`service-${i}`, {
                        tags: [`tag-${i}`, 'common-tag'],
                    }));
                }
                
                expect(registry.findByTag('common-tag')).toHaveLength(1000);
                expect(registry.getTags()).toHaveLength(1001); // 1000 unique + 1 common
            });
        });
    });
});
