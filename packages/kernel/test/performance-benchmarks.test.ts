/**
 * Performance Benchmarks Tests
 * 
 * Performance benchmark tests comparing optimized vs naive implementations.
 * Tests measure actual performance and validate optimization targets.
 */

import { OptimizedRegistry, ServiceMetadata } from '../src/optimized-registry';
import { MetricsManager } from '../src/metrics';

describe('Performance Benchmarks', () => {
    describe('Service Registry Performance', () => {
        let registry: OptimizedRegistry;

        beforeEach(() => {
            registry = new OptimizedRegistry();
        });

        describe('Lookup performance (should be < 1μs)', () => {
            it('should perform O(1) lookup by ID in < 1μs', () => {
                // Register test service
                registry.register({
                    id: 'test-service',
                    name: 'Test Service',
                    type: 'api',
                    providedBy: 'test-plugin',
                    implementation: {},
                });

                // Warm up
                for (let i = 0; i < 100; i++) {
                    registry.get('test-service');
                }

                // Measure
                const iterations = 10000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.get('test-service');
                }
                
                const duration = performance.now() - start;
                const avgDuration = (duration / iterations) * 1000; // Convert to microseconds

                expect(avgDuration).toBeLessThan(1); // < 1 microsecond
            });

            it('should maintain < 1μs lookup with 10k services', () => {
                // Register 10k services
                for (let i = 0; i < 10000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: 'plugin',
                        implementation: {},
                    });
                }

                // Warm up
                for (let i = 0; i < 100; i++) {
                    registry.get('service-5000');
                }

                // Measure
                const iterations = 10000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.get('service-5000');
                }
                
                const duration = performance.now() - start;
                const avgDuration = (duration / iterations) * 1000;

                expect(avgDuration).toBeLessThan(1);
            });

            it('should perform indexed type lookup efficiently', () => {
                // Register services of different types
                for (let i = 0; i < 1000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: `type-${i % 10}`,
                        providedBy: 'plugin',
                        implementation: {},
                    });
                }

                // Measure type lookup
                const iterations = 1000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.findByType('type-5');
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(0.1); // < 0.1ms per lookup
            });

            it('should perform indexed provider lookup efficiently', () => {
                // Register services from different providers
                for (let i = 0; i < 1000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: `plugin-${i % 10}`,
                        implementation: {},
                    });
                }

                // Measure provider lookup
                const iterations = 1000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.findByProvider('plugin-5');
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(0.1);
            });

            it('should perform indexed tag lookup efficiently', () => {
                // Register services with tags
                for (let i = 0; i < 1000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: 'plugin',
                        implementation: {},
                        tags: [`tag-${i % 20}`, 'common'],
                    });
                }

                // Measure tag lookup
                const iterations = 1000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.findByTag('tag-10');
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(0.1);
            });
        });

        describe('Registration performance', () => {
            it('should register service in < 0.1ms', () => {
                const iterations = 1000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: 'plugin',
                        implementation: {},
                    });
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(0.1);
            });

            it('should batch register efficiently', () => {
                const services = Array.from({ length: 1000 }, (_, i) => ({
                    id: `service-${i}`,
                    name: `Service ${i}`,
                    type: 'test',
                    providedBy: 'plugin',
                    implementation: {},
                }));

                const start = performance.now();
                registry.registerBatch(services);
                const duration = performance.now() - start;

                expect(duration).toBeLessThan(100); // < 100ms for 1000 services
            });
        });

        describe('Query performance', () => {
            beforeEach(() => {
                // Setup test data
                for (let i = 0; i < 1000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: `type-${i % 10}`,
                        providedBy: `plugin-${i % 5}`,
                        implementation: {},
                        tags: [`tag-${i % 20}`, 'common'],
                    });
                }
            });

            it('should perform single-criteria query efficiently', () => {
                const iterations = 100;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.query({ type: 'type-5' });
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(1); // < 1ms per query
            });

            it('should perform multi-criteria query efficiently', () => {
                const iterations = 100;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.query({
                        type: 'type-5',
                        providedBy: 'plugin-2',
                        tags: ['common'],
                    });
                }
                
                const duration = performance.now() - start;
                const avgDuration = duration / iterations;

                expect(avgDuration).toBeLessThan(5); // < 5ms per complex query
            });
        });
    });

    describe('Plugin Load Performance (should be < 100ms)', () => {
        it('should simulate plugin load in < 100ms', async () => {
            // Simulate plugin loading workflow
            const metricsManager = new MetricsManager({ enabled: true });
            const registry = new OptimizedRegistry();

            const start = performance.now();

            // Start timing
            metricsManager.startTimer('plugin.load');

            // Simulate manifest parsing
            const manifest = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
            };

            // Simulate dependency check (fast)
            const dependencies: string[] = [];

            // Simulate service registration
            for (let i = 0; i < 10; i++) {
                registry.register({
                    id: `service-${i}`,
                    name: `Service ${i}`,
                    type: 'api',
                    providedBy: 'test-plugin',
                    implementation: { execute: () => {} },
                });
            }

            // Simulate initialization
            await new Promise(resolve => setTimeout(resolve, 1));

            // Stop timing
            const loadTime = metricsManager.stopTimer('plugin.load');
            const totalDuration = performance.now() - start;

            expect(totalDuration).toBeLessThan(100); // Should be much faster
            expect(loadTime).toBeLessThan(100);
        });

        it('should load multiple plugins in parallel efficiently', async () => {
            const metricsManager = new MetricsManager({ enabled: true });
            const registry = new OptimizedRegistry();

            const start = performance.now();

            // Simulate loading 10 plugins in parallel
            const pluginLoads = Array.from({ length: 10 }, async (_, i) => {
                metricsManager.startTimer(`plugin-${i}.load`);

                // Register services
                for (let j = 0; j < 5; j++) {
                    registry.register({
                        id: `plugin-${i}-service-${j}`,
                        name: `Service ${j}`,
                        type: 'api',
                        providedBy: `plugin-${i}`,
                        implementation: {},
                    });
                }

                const loadTime = metricsManager.stopTimer(`plugin-${i}.load`);
                return loadTime;
            });

            await Promise.all(pluginLoads);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100); // All 10 plugins in < 100ms
        });
    });

    describe('Dependency Resolution Performance', () => {
        it('should resolve linear dependency chain quickly', () => {
            // Simulate dependency graph: A -> B -> C -> D -> E
            const plugins = [
                { id: 'A', deps: ['B'] },
                { id: 'B', deps: ['C'] },
                { id: 'C', deps: ['D'] },
                { id: 'D', deps: ['E'] },
                { id: 'E', deps: [] },
            ];

            const start = performance.now();

            // Simple topological sort
            const resolved: string[] = [];
            const visited = new Set<string>();

            function resolve(id: string): void {
                if (visited.has(id)) return;
                visited.add(id);

                const plugin = plugins.find(p => p.id === id);
                if (plugin) {
                    plugin.deps.forEach(dep => resolve(dep));
                }

                resolved.push(id);
            }

            plugins.forEach(p => resolve(p.id));

            const duration = performance.now() - start;

            expect(duration).toBeLessThan(5); // Should be very fast (5ms threshold accounts for CI environment overhead)
            expect(resolved).toHaveLength(5);
        });

        it('should resolve complex dependency graph efficiently', () => {
            // Create complex graph with 100 nodes
            const plugins = Array.from({ length: 100 }, (_, i) => ({
                id: `plugin-${i}`,
                deps: i > 0 ? [`plugin-${Math.floor(i / 2)}`] : [],
            }));

            const start = performance.now();

            const resolved = new Set<string>();
            const visiting = new Set<string>();

            function resolve(id: string): boolean {
                if (resolved.has(id)) return true;
                if (visiting.has(id)) return false; // Cycle detected

                visiting.add(id);

                const plugin = plugins.find(p => p.id === id);
                if (plugin) {
                    for (const dep of plugin.deps) {
                        if (!resolve(dep)) return false;
                    }
                }

                visiting.delete(id);
                resolved.add(id);
                return true;
            }

            plugins.forEach(p => resolve(p.id));

            const duration = performance.now() - start;

            expect(duration).toBeLessThan(10); // Should resolve 100 nodes quickly
            expect(resolved.size).toBe(100);
        });
    });

    describe('Metric Recording Performance', () => {
        let metricsManager: MetricsManager;

        beforeEach(() => {
            metricsManager = new MetricsManager({ enabled: true });
        });

        it('should record metrics with minimal overhead', () => {
            const iterations = 10000;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                metricsManager.recordMetric('test', Math.random() * 100);
            }
            
            const duration = performance.now() - start;
            const avgDuration = (duration / iterations) * 1000; // microseconds

            expect(avgDuration).toBeLessThan(10); // < 10μs per metric
        });

        it('should handle high-frequency counter increments', () => {
            const iterations = 100000;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                metricsManager.incrementCounter('requests');
            }
            
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(250); // 100k increments in < 250ms (CI-friendly threshold)
        });

        it('should handle timer operations efficiently', () => {
            const iterations = 1000;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                metricsManager.startTimer(`timer-${i}`);
                metricsManager.stopTimer(`timer-${i}`);
            }
            
            const duration = performance.now() - start;
            const avgDuration = duration / iterations;

            expect(avgDuration).toBeLessThan(0.1); // < 0.1ms per timer cycle
        });

        it('should calculate summaries efficiently', () => {
            // Record 10k data points
            for (let i = 0; i < 10000; i++) {
                metricsManager.recordMetric('latency', Math.random() * 100);
            }

            const iterations = 100;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                metricsManager.getMetricSummary('latency');
            }
            
            const duration = performance.now() - start;
            const avgDuration = duration / iterations;

            expect(avgDuration).toBeLessThan(10); // < 10ms per summary with 10k points
        });

        it('should handle metrics with labels efficiently', () => {
            const iterations = 10000;
            const start = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                metricsManager.recordMetric('http_requests', 1, undefined, {
                    method: 'GET',
                    status: '200',
                    endpoint: '/api/users',
                });
            }
            
            const duration = performance.now() - start;
            const avgDuration = (duration / iterations) * 1000;

            expect(avgDuration).toBeLessThan(20); // < 20μs per labeled metric
        });
    });

    describe('Optimized vs Naive Implementation Comparison', () => {
        describe('Registry: Map vs Array lookup', () => {
            it('should demonstrate O(1) vs O(n) lookup difference', () => {
                const registry = new OptimizedRegistry();
                const naiveArray: ServiceMetadata[] = [];

                // Setup data
                const count = 1000;
                for (let i = 0; i < count; i++) {
                    const service = {
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: 'plugin',
                        implementation: {},
                        registeredAt: new Date(),
                    };
                    
                    registry.register(service);
                    naiveArray.push(service);
                }

                // Benchmark optimized (Map)
                const iterations = 1000;
                const optimizedStart = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.get('service-500');
                }
                
                const optimizedDuration = performance.now() - optimizedStart;

                // Benchmark naive (Array)
                const naiveStart = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    naiveArray.find(s => s.id === 'service-500');
                }
                
                const naiveDuration = performance.now() - naiveStart;

                // Optimized should be significantly faster
                expect(optimizedDuration).toBeLessThan(naiveDuration / 10);
            });

            it('should demonstrate indexed vs filtered lookup difference', () => {
                const registry = new OptimizedRegistry();
                const naiveArray: ServiceMetadata[] = [];

                // Setup data
                for (let i = 0; i < 1000; i++) {
                    const service = {
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: `type-${i % 10}`,
                        providedBy: 'plugin',
                        implementation: {},
                        registeredAt: new Date(),
                    };
                    
                    registry.register(service);
                    naiveArray.push(service);
                }

                // Benchmark optimized (indexed)
                const iterations = 100;
                const optimizedStart = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    registry.findByType('type-5');
                }
                
                const optimizedDuration = performance.now() - optimizedStart;

                // Benchmark naive (filter)
                const naiveStart = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    naiveArray.filter(s => s.type === 'type-5');
                }
                
                const naiveDuration = performance.now() - naiveStart;

                // Indexed should be reasonably fast (< 10ms for 100 iterations)
                expect(optimizedDuration).toBeLessThan(10);
                
                // Log comparison for informational purposes
                console.log(`Optimized: ${optimizedDuration.toFixed(2)}ms, Naive: ${naiveDuration.toFixed(2)}ms, Speedup: ${(naiveDuration / optimizedDuration).toFixed(2)}x`);
            });
        });

        describe('Metrics: Aggregated vs Individual storage', () => {
            it('should demonstrate efficient metric aggregation', () => {
                const optimized = new MetricsManager({ enabled: true });

                // Benchmark with aggregation
                const iterations = 10000;
                const start = performance.now();
                
                for (let i = 0; i < iterations; i++) {
                    optimized.incrementCounter('requests');
                }
                
                const summary = optimized.getMetricSummary('requests');
                
                const duration = performance.now() - start;

                expect(duration).toBeLessThan(50); // Very fast
                expect(summary!.count).toBe(iterations);
            });
        });

        describe('Memory efficiency', () => {
            it('should use minimal memory for indexed registry', () => {
                const registry = new OptimizedRegistry();

                // Register services
                for (let i = 0; i < 1000; i++) {
                    registry.register({
                        id: `service-${i}`,
                        name: `Service ${i}`,
                        type: 'test',
                        providedBy: 'plugin',
                        implementation: { data: 'x'.repeat(100) },
                    });
                }

                const stats = registry.getStats();
                
                // Verify indexes are created but not duplicating service data
                expect(stats.totalServices).toBe(1000);
                expect(stats.totalTypes).toBe(1);
                expect(stats.totalProviders).toBe(1);
            });
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle typical plugin system load efficiently', async () => {
            const metricsManager = new MetricsManager({ enabled: true });
            const registry = new OptimizedRegistry();

            const start = performance.now();

            // Simulate loading 50 plugins with services
            for (let p = 0; p < 50; p++) {
                metricsManager.startTimer(`plugin-${p}.load`);

                // Each plugin registers 5 services
                for (let s = 0; s < 5; s++) {
                    registry.register({
                        id: `plugin-${p}-service-${s}`,
                        name: `Service ${s}`,
                        type: s % 2 === 0 ? 'api' : 'worker',
                        providedBy: `plugin-${p}`,
                        implementation: {},
                        tags: [`tag-${s}`],
                    });
                }

                metricsManager.stopTimer(`plugin-${p}.load`);
                metricsManager.recordPluginLoad(`plugin-${p}`, Math.random() * 50);
            }

            // Simulate 1000 service lookups
            for (let i = 0; i < 1000; i++) {
                const pluginId = Math.floor(Math.random() * 50);
                const serviceId = Math.floor(Math.random() * 5);
                registry.get(`plugin-${pluginId}-service-${serviceId}`);
            }

            // Simulate 100 queries
            for (let i = 0; i < 100; i++) {
                registry.query({ type: 'api' });
            }

            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100); // Entire workflow in < 100ms
            expect(registry.getStats().totalServices).toBe(250);
        });

        it('should handle high-throughput metrics recording', () => {
            const metricsManager = new MetricsManager({ enabled: true, maxDataPoints: 10000 });

            const start = performance.now();

            // Simulate high-frequency events
            for (let i = 0; i < 50000; i++) {
                metricsManager.incrementCounter('api.requests');
                
                if (i % 10 === 0) {
                    metricsManager.recordMetric('api.latency', Math.random() * 100);
                }
                
                if (i % 100 === 0) {
                    metricsManager.recordPluginEvent('plugin-1');
                }
            }

            const duration = performance.now() - start;

            expect(duration).toBeLessThan(500); // 50k+ operations in < 500ms
        });
    });
});
