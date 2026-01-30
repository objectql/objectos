/**
 * MetricsManager Tests
 * 
 * Comprehensive test suite for plugin metrics collection and performance tracking.
 */

import { MetricsManager, PerformanceTimer, MetricType } from '../src/metrics';

describe('MetricsManager', () => {
    let metricsManager: MetricsManager;

    beforeEach(() => {
        metricsManager = new MetricsManager({ enabled: true });
    });

    afterEach(() => {
        metricsManager.clear();
    });

    describe('PerformanceTimer', () => {
        describe('timer start/stop functionality', () => {
            it('should create a timer and measure elapsed time', () => {
                const timer = new PerformanceTimer();
                const start = performance.now();
                
                // Simulate some work
                let sum = 0;
                for (let i = 0; i < 1000; i++) {
                    sum += i;
                }
                
                const duration = timer.stop();
                const end = performance.now();
                
                expect(duration).toBeGreaterThan(0);
                expect(duration).toBeLessThanOrEqual(end - start + 1); // Allow 1ms margin
            });

            it('should return same duration on multiple stop calls', () => {
                const timer = new PerformanceTimer();
                const duration1 = timer.stop();
                const duration2 = timer.stop();
                
                expect(duration1).toBe(duration2);
            });

            it('should measure elapsed time without stopping', () => {
                const timer = new PerformanceTimer();
                
                const elapsed1 = timer.elapsed();
                expect(elapsed1).toBeGreaterThan(0);
                
                // Wait a bit
                let sum = 0;
                for (let i = 0; i < 1000; i++) {
                    sum += i;
                }
                
                const elapsed2 = timer.elapsed();
                expect(elapsed2).toBeGreaterThan(elapsed1);
            });
        });
    });

    describe('Timer management', () => {
        it('should start a timer', () => {
            metricsManager.startTimer('test-timer');
            expect(metricsManager.stopTimer('test-timer')).toBeGreaterThanOrEqual(0);
        });

        it('should stop a timer and return duration', () => {
            metricsManager.startTimer('test-timer');
            
            // Simulate work
            let sum = 0;
            for (let i = 0; i < 1000; i++) {
                sum += i;
            }
            
            const duration = metricsManager.stopTimer('test-timer');
            expect(duration).toBeGreaterThan(0);
        });

        it('should record timer duration as histogram metric', () => {
            metricsManager.startTimer('test-timer');
            const duration = metricsManager.stopTimer('test-timer')!;
            
            const summary = metricsManager.getMetricSummary('test-timer');
            expect(summary).toBeDefined();
            expect(summary!.count).toBe(1);
            expect(summary!.sum).toBeCloseTo(duration, 2);
        });

        it('should handle stopping non-existent timer', () => {
            const result = metricsManager.stopTimer('non-existent');
            expect(result).toBeUndefined();
        });

        it('should support timer with labels', () => {
            metricsManager.startTimer('api-call');
            const duration = metricsManager.stopTimer('api-call', { endpoint: '/users', method: 'GET' });
            
            expect(duration).toBeGreaterThanOrEqual(0);
            
            const summary = metricsManager.getMetricSummary('api-call', { endpoint: '/users', method: 'GET' });
            expect(summary).toBeDefined();
        });

        it('should remove timer after stopping', () => {
            metricsManager.startTimer('test-timer');
            metricsManager.stopTimer('test-timer');
            
            // Stopping again should return undefined
            expect(metricsManager.stopTimer('test-timer')).toBeUndefined();
        });
    });

    describe('Metric recording', () => {
        describe('counter metrics', () => {
            it('should record counter metric', () => {
                metricsManager.recordMetric('requests', 1, MetricType.COUNTER);
                
                const summary = metricsManager.getMetricSummary('requests');
                expect(summary).toBeDefined();
                expect(summary!.count).toBe(1);
                expect(summary!.sum).toBe(1);
            });

            it('should increment counter multiple times', () => {
                metricsManager.incrementCounter('errors', 1);
                metricsManager.incrementCounter('errors', 2);
                metricsManager.incrementCounter('errors', 3);
                
                const summary = metricsManager.getMetricSummary('errors');
                expect(summary!.count).toBe(3);
                expect(summary!.sum).toBe(6);
            });

            it('should increment counter with default value', () => {
                metricsManager.incrementCounter('clicks');
                
                const summary = metricsManager.getMetricSummary('clicks');
                expect(summary!.sum).toBe(1);
            });

            it('should increment counter with labels', () => {
                metricsManager.incrementCounter('http_requests', 1, { status: '200' });
                metricsManager.incrementCounter('http_requests', 1, { status: '200' });
                metricsManager.incrementCounter('http_requests', 1, { status: '404' });
                
                const summary200 = metricsManager.getMetricSummary('http_requests', { status: '200' });
                const summary404 = metricsManager.getMetricSummary('http_requests', { status: '404' });
                
                expect(summary200!.count).toBe(2);
                expect(summary404!.count).toBe(1);
            });
        });

        describe('gauge metrics', () => {
            it('should set gauge value', () => {
                metricsManager.setGauge('cpu_usage', 75.5);
                
                const summary = metricsManager.getMetricSummary('cpu_usage');
                expect(summary!.count).toBe(1);
                expect(summary!.avg).toBe(75.5);
            });

            it('should update gauge value', () => {
                metricsManager.setGauge('memory', 100);
                metricsManager.setGauge('memory', 150);
                metricsManager.setGauge('memory', 200);
                
                const summary = metricsManager.getMetricSummary('memory');
                expect(summary!.count).toBe(3);
                expect(summary!.min).toBe(100);
                expect(summary!.max).toBe(200);
                expect(summary!.avg).toBeCloseTo(150, 2);
            });

            it('should set gauge with labels', () => {
                metricsManager.setGauge('temperature', 25.5, { sensor: 'A' });
                metricsManager.setGauge('temperature', 30.2, { sensor: 'B' });
                
                const summaryA = metricsManager.getMetricSummary('temperature', { sensor: 'A' });
                const summaryB = metricsManager.getMetricSummary('temperature', { sensor: 'B' });
                
                expect(summaryA!.avg).toBe(25.5);
                expect(summaryB!.avg).toBe(30.2);
            });
        });

        describe('histogram metrics', () => {
            it('should record histogram values', () => {
                const values = [10, 20, 30, 40, 50];
                values.forEach(v => metricsManager.recordMetric('latency', v, MetricType.HISTOGRAM));
                
                const summary = metricsManager.getMetricSummary('latency');
                expect(summary!.count).toBe(5);
                expect(summary!.min).toBe(10);
                expect(summary!.max).toBe(50);
                expect(summary!.avg).toBe(30);
            });

            it('should handle large histogram datasets', () => {
                for (let i = 0; i < 1000; i++) {
                    metricsManager.recordMetric('response_time', Math.random() * 100, MetricType.HISTOGRAM);
                }
                
                const summary = metricsManager.getMetricSummary('response_time');
                expect(summary!.count).toBe(1000);
                expect(summary!.min).toBeGreaterThanOrEqual(0);
                expect(summary!.max).toBeLessThanOrEqual(100);
            });
        });

        it('should enforce max data points limit', () => {
            const limitedManager = new MetricsManager({ enabled: true, maxDataPoints: 100 });
            
            // Add more than limit
            for (let i = 0; i < 150; i++) {
                limitedManager.recordMetric('test', i);
            }
            
            const summary = limitedManager.getMetricSummary('test');
            expect(summary!.count).toBe(100); // Should only keep last 100
            expect(summary!.min).toBe(50); // First 50 should be dropped
        });
    });

    describe('Plugin metrics', () => {
        describe('plugin load time', () => {
            it('should record plugin load time', () => {
                metricsManager.recordPluginLoad('test-plugin', 123.45);
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics).toBeDefined();
                expect(metrics!.loadTime).toBe(123.45);
            });

            it('should record load time metric', () => {
                metricsManager.recordPluginLoad('test-plugin', 100);
                
                const summary = metricsManager.getMetricSummary('plugin.load.duration', { pluginId: 'test-plugin' });
                expect(summary).toBeDefined();
                expect(summary!.sum).toBe(100);
            });

            it('should update lastUpdated timestamp', () => {
                const before = new Date();
                metricsManager.recordPluginLoad('test-plugin', 50);
                const after = new Date();
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
                expect(metrics!.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
            });
        });

        describe('plugin install time', () => {
            it('should record plugin install time', () => {
                metricsManager.recordPluginInstall('test-plugin', 250.5);
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.installTime).toBe(250.5);
            });

            it('should record install time metric', () => {
                metricsManager.recordPluginInstall('test-plugin', 200);
                
                const summary = metricsManager.getMetricSummary('plugin.install.duration', { pluginId: 'test-plugin' });
                expect(summary!.sum).toBe(200);
            });
        });

        describe('plugin enable time', () => {
            it('should record plugin enable time', () => {
                metricsManager.recordPluginEnable('test-plugin', 75.25);
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.enableTime).toBe(75.25);
            });

            it('should record enable time metric', () => {
                metricsManager.recordPluginEnable('test-plugin', 80);
                
                const summary = metricsManager.getMetricSummary('plugin.enable.duration', { pluginId: 'test-plugin' });
                expect(summary!.sum).toBe(80);
            });
        });

        describe('plugin events', () => {
            it('should track plugin event count', () => {
                metricsManager.recordPluginEvent('test-plugin');
                metricsManager.recordPluginEvent('test-plugin');
                metricsManager.recordPluginEvent('test-plugin');
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.eventCount).toBe(3);
            });

            it('should record event counter metric', () => {
                metricsManager.recordPluginEvent('test-plugin');
                metricsManager.recordPluginEvent('test-plugin');
                
                const summary = metricsManager.getMetricSummary('plugin.events', { pluginId: 'test-plugin' });
                expect(summary!.count).toBe(2);
            });
        });

        describe('plugin errors', () => {
            it('should track plugin error count', () => {
                metricsManager.recordPluginError('test-plugin');
                metricsManager.recordPluginError('test-plugin');
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.errorCount).toBe(2);
            });

            it('should record error counter metric', () => {
                metricsManager.recordPluginError('test-plugin');
                
                const summary = metricsManager.getMetricSummary('plugin.errors', { pluginId: 'test-plugin' });
                expect(summary!.count).toBe(1);
            });
        });

        describe('plugin API calls', () => {
            it('should track plugin API call count', () => {
                metricsManager.recordPluginApiCall('test-plugin');
                metricsManager.recordPluginApiCall('test-plugin');
                metricsManager.recordPluginApiCall('test-plugin');
                metricsManager.recordPluginApiCall('test-plugin');
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.apiCallCount).toBe(4);
            });

            it('should record API call counter metric', () => {
                metricsManager.recordPluginApiCall('test-plugin');
                metricsManager.recordPluginApiCall('test-plugin');
                
                const summary = metricsManager.getMetricSummary('plugin.api.calls', { pluginId: 'test-plugin' });
                expect(summary!.count).toBe(2);
            });
        });

        describe('plugin memory usage', () => {
            it('should record plugin memory usage', () => {
                metricsManager.recordPluginMemory('test-plugin', 1024 * 1024);
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.memoryUsage).toBe(1024 * 1024);
            });

            it('should update memory usage', () => {
                metricsManager.recordPluginMemory('test-plugin', 1000);
                metricsManager.recordPluginMemory('test-plugin', 2000);
                
                const metrics = metricsManager.getPluginMetrics('test-plugin');
                expect(metrics!.memoryUsage).toBe(2000);
            });

            it('should record memory gauge metric', () => {
                metricsManager.recordPluginMemory('test-plugin', 5000);
                
                const summary = metricsManager.getMetricSummary('plugin.memory.bytes', { pluginId: 'test-plugin' });
                expect(summary!.avg).toBe(5000);
            });
        });

        it('should initialize plugin metrics on first access', () => {
            metricsManager.recordPluginEvent('new-plugin');
            
            const metrics = metricsManager.getPluginMetrics('new-plugin');
            expect(metrics).toBeDefined();
            expect(metrics!.pluginId).toBe('new-plugin');
            expect(metrics!.errorCount).toBe(0);
            expect(metrics!.eventCount).toBe(1);
            expect(metrics!.apiCallCount).toBe(0);
        });

        it('should return undefined for non-existent plugin', () => {
            const metrics = metricsManager.getPluginMetrics('non-existent');
            expect(metrics).toBeUndefined();
        });

        it('should get all plugin metrics', () => {
            metricsManager.recordPluginLoad('plugin1', 100);
            metricsManager.recordPluginLoad('plugin2', 200);
            
            const allMetrics = metricsManager.getAllPluginMetrics();
            expect(allMetrics.size).toBe(2);
            expect(allMetrics.has('plugin1')).toBe(true);
            expect(allMetrics.has('plugin2')).toBe(true);
        });
    });

    describe('Metric summaries', () => {
        it('should calculate count', () => {
            metricsManager.recordMetric('test', 10);
            metricsManager.recordMetric('test', 20);
            metricsManager.recordMetric('test', 30);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.count).toBe(3);
        });

        it('should calculate sum', () => {
            metricsManager.recordMetric('test', 10);
            metricsManager.recordMetric('test', 20);
            metricsManager.recordMetric('test', 30);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.sum).toBe(60);
        });

        it('should calculate min', () => {
            metricsManager.recordMetric('test', 50);
            metricsManager.recordMetric('test', 10);
            metricsManager.recordMetric('test', 30);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.min).toBe(10);
        });

        it('should calculate max', () => {
            metricsManager.recordMetric('test', 50);
            metricsManager.recordMetric('test', 10);
            metricsManager.recordMetric('test', 30);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.max).toBe(50);
        });

        it('should calculate avg', () => {
            metricsManager.recordMetric('test', 10);
            metricsManager.recordMetric('test', 20);
            metricsManager.recordMetric('test', 30);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.avg).toBeCloseTo(20, 2);
        });

        it('should calculate p50 percentile', () => {
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            values.forEach(v => metricsManager.recordMetric('test', v));
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.p50).toBeGreaterThanOrEqual(5);
            expect(summary!.p50).toBeLessThanOrEqual(6);
        });

        it('should calculate p95 percentile', () => {
            const values = Array.from({ length: 100 }, (_, i) => i + 1);
            values.forEach(v => metricsManager.recordMetric('test', v));
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.p95).toBeGreaterThanOrEqual(94);
            expect(summary!.p95).toBeLessThanOrEqual(96);
        });

        it('should calculate p99 percentile', () => {
            const values = Array.from({ length: 100 }, (_, i) => i + 1);
            values.forEach(v => metricsManager.recordMetric('test', v));
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.p99).toBeGreaterThanOrEqual(98);
            expect(summary!.p99).toBeLessThanOrEqual(100);
        });

        it('should return undefined for non-existent metric', () => {
            const summary = metricsManager.getMetricSummary('non-existent');
            expect(summary).toBeUndefined();
        });

        it('should return undefined for empty metric', () => {
            // Create metric but don't add any data points
            const summary = metricsManager.getMetricSummary('empty');
            expect(summary).toBeUndefined();
        });

        it('should handle single value summary', () => {
            metricsManager.recordMetric('test', 42);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.count).toBe(1);
            expect(summary!.sum).toBe(42);
            expect(summary!.min).toBe(42);
            expect(summary!.max).toBe(42);
            expect(summary!.avg).toBe(42);
            expect(summary!.p50).toBe(42);
            expect(summary!.p95).toBe(42);
            expect(summary!.p99).toBe(42);
        });
    });

    describe('Snapshot functionality', () => {
        it('should create snapshot with plugin metrics', () => {
            metricsManager.recordPluginLoad('plugin1', 100);
            metricsManager.recordPluginLoad('plugin2', 200);
            
            const snapshot = metricsManager.getSnapshot();
            
            expect(snapshot.plugins).toBeDefined();
            expect(Object.keys(snapshot.plugins).length).toBe(2);
            expect(snapshot.plugins['plugin1'].loadTime).toBe(100);
            expect(snapshot.plugins['plugin2'].loadTime).toBe(200);
        });

        it('should create snapshot with custom metrics', () => {
            metricsManager.recordMetric('requests', 10);
            metricsManager.recordMetric('requests', 20);
            
            const snapshot = metricsManager.getSnapshot();
            
            expect(snapshot.custom).toBeDefined();
            expect(snapshot.custom['requests']).toBeDefined();
            expect(snapshot.custom['requests'].count).toBe(2);
        });

        it('should include timestamp in snapshot', () => {
            const before = new Date();
            const snapshot = metricsManager.getSnapshot();
            const after = new Date();
            
            expect(snapshot.timestamp).toBeDefined();
            expect(snapshot.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(snapshot.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('should create immutable snapshot', () => {
            metricsManager.recordPluginLoad('plugin1', 100);
            
            const snapshot1 = metricsManager.getSnapshot();
            
            // Modify original data
            metricsManager.recordPluginLoad('plugin1', 200);
            
            const snapshot2 = metricsManager.getSnapshot();
            
            // First snapshot should be unchanged
            expect(snapshot1.plugins['plugin1'].loadTime).toBe(100);
            expect(snapshot2.plugins['plugin1'].loadTime).toBe(200);
        });

        it('should handle empty snapshot', () => {
            const snapshot = metricsManager.getSnapshot();
            
            expect(snapshot.plugins).toEqual({});
            expect(snapshot.custom).toEqual({});
            expect(snapshot.timestamp).toBeDefined();
        });
    });

    describe('Clear and reset', () => {
        it('should clear all plugin metrics', () => {
            metricsManager.recordPluginLoad('plugin1', 100);
            metricsManager.recordPluginLoad('plugin2', 200);
            
            metricsManager.clear();
            
            expect(metricsManager.getPluginMetrics('plugin1')).toBeUndefined();
            expect(metricsManager.getPluginMetrics('plugin2')).toBeUndefined();
        });

        it('should clear all custom metrics', () => {
            metricsManager.recordMetric('test1', 10);
            metricsManager.recordMetric('test2', 20);
            
            metricsManager.clear();
            
            expect(metricsManager.getMetricSummary('test1')).toBeUndefined();
            expect(metricsManager.getMetricSummary('test2')).toBeUndefined();
        });

        it('should clear all timers', () => {
            metricsManager.startTimer('timer1');
            metricsManager.startTimer('timer2');
            
            metricsManager.clear();
            
            expect(metricsManager.stopTimer('timer1')).toBeUndefined();
            expect(metricsManager.stopTimer('timer2')).toBeUndefined();
        });

        it('should allow recording after clear', () => {
            metricsManager.recordMetric('test', 10);
            metricsManager.clear();
            metricsManager.recordMetric('test', 20);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.count).toBe(1);
            expect(summary!.sum).toBe(20);
        });
    });

    describe('Enable/disable metrics', () => {
        it('should be enabled by default', () => {
            expect(metricsManager.isEnabled()).toBe(true);
        });

        it('should disable metrics collection', () => {
            metricsManager.setEnabled(false);
            expect(metricsManager.isEnabled()).toBe(false);
        });

        it('should not record metrics when disabled', () => {
            metricsManager.setEnabled(false);
            metricsManager.recordMetric('test', 10);
            
            expect(metricsManager.getMetricSummary('test')).toBeUndefined();
        });

        it('should not start timers when disabled', () => {
            metricsManager.setEnabled(false);
            metricsManager.startTimer('test-timer');
            
            const duration = metricsManager.stopTimer('test-timer');
            expect(duration).toBeUndefined();
        });

        it('should not record custom metrics for plugins when disabled', () => {
            metricsManager.setEnabled(false);
            metricsManager.recordPluginLoad('test-plugin', 100);
            
            // Plugin metrics are still tracked, but custom metrics are not
            expect(metricsManager.getPluginMetrics('test-plugin')).toBeDefined();
            expect(metricsManager.getMetricSummary('plugin.load.duration', { pluginId: 'test-plugin' })).toBeUndefined();
        });

        it('should allow re-enabling metrics', () => {
            metricsManager.setEnabled(false);
            metricsManager.setEnabled(true);
            
            metricsManager.recordMetric('test', 10);
            expect(metricsManager.getMetricSummary('test')).toBeDefined();
        });

        it('should create manager with disabled metrics', () => {
            const disabledManager = new MetricsManager({ enabled: false });
            expect(disabledManager.isEnabled()).toBe(false);
        });
    });

    describe('Label handling', () => {
        it('should differentiate metrics by labels', () => {
            metricsManager.recordMetric('http_requests', 1, MetricType.COUNTER, { method: 'GET' });
            metricsManager.recordMetric('http_requests', 1, MetricType.COUNTER, { method: 'POST' });
            
            const getRequests = metricsManager.getMetricSummary('http_requests', { method: 'GET' });
            const postRequests = metricsManager.getMetricSummary('http_requests', { method: 'POST' });
            
            expect(getRequests!.count).toBe(1);
            expect(postRequests!.count).toBe(1);
        });

        it('should sort labels consistently', () => {
            metricsManager.recordMetric('test', 1, MetricType.COUNTER, { b: '2', a: '1' });
            metricsManager.recordMetric('test', 1, MetricType.COUNTER, { a: '1', b: '2' });
            
            const summary = metricsManager.getMetricSummary('test', { a: '1', b: '2' });
            expect(summary!.count).toBe(2);
        });

        it('should handle empty labels', () => {
            metricsManager.recordMetric('test', 1, MetricType.COUNTER, {});
            metricsManager.recordMetric('test', 1, MetricType.COUNTER);
            
            const summary = metricsManager.getMetricSummary('test');
            expect(summary!.count).toBe(2);
        });
    });
});
