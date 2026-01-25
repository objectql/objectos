/**
 * Endpoint Registry Tests
 */

import {
    EndpointRegistry,
    createEndpointRegistry,
    EndpointType,
    type EndpointHandler,
} from '../src/api/endpoint-registry';
import { createRouter } from '../src/api/router';

describe('EndpointRegistry', () => {
    let registry: EndpointRegistry;
    let mockHandler: EndpointHandler;

    beforeEach(() => {
        const router = createRouter();
        registry = createEndpointRegistry(router);

        mockHandler = {
            execute: jest.fn(),
        };
    });

    describe('Handler Registration', () => {
        it('should register endpoint handler', () => {
            expect(() => {
                registry.registerHandler(EndpointType.FLOW, mockHandler);
            }).not.toThrow();
        });
    });

    describe('Endpoint Registration', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
        });

        it('should register valid endpoint', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: '/api/test',
                config: { flowId: 'test-flow' },
            };

            registry.registerEndpoint(config);

            const endpoint = registry.getEndpoint('test-endpoint');
            expect(endpoint).toBeDefined();
            expect(endpoint?.id).toBe('test-endpoint');
        });

        it('should register endpoint with metadata', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: '/api/test',
                summary: 'Test endpoint',
                description: 'A test endpoint',
                tags: ['test'],
                config: { flowId: 'test-flow' },
            };

            registry.registerEndpoint(config);

            const endpoint = registry.getEndpoint('test-endpoint');
            expect(endpoint?.summary).toBe('Test endpoint');
            expect(endpoint?.description).toBe('A test endpoint');
            expect(endpoint?.tags).toContain('test');
        });

        it('should throw error for duplicate endpoint id', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: '/api/test',
                config: { flowId: 'test-flow' },
            };

            registry.registerEndpoint(config);

            expect(() => {
                registry.registerEndpoint(config);
            }).toThrow("Endpoint with id 'test-endpoint' already registered");
        });

        it('should throw error for missing handler', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.SCRIPT,
                method: 'POST' as const,
                path: '/api/test',
                config: {},
            };

            expect(() => {
                registry.registerEndpoint(config);
            }).toThrow("No handler registered for endpoint type 'script'");
        });

        it('should throw error for invalid endpoint id', () => {
            const config = {
                id: '',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: '/api/test',
                config: {},
            };

            expect(() => {
                registry.registerEndpoint(config);
            }).toThrow('Endpoint id is required');
        });

        it('should throw error for invalid path', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: 'api/test', // Missing leading slash
                config: {},
            };

            expect(() => {
                registry.registerEndpoint(config);
            }).toThrow('Endpoint path must start with /');
        });
    });

    describe('Endpoint Unregistration', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
        });

        it('should unregister endpoint', () => {
            const config = {
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST' as const,
                path: '/api/test',
                config: { flowId: 'test-flow' },
            };

            registry.registerEndpoint(config);
            const removed = registry.unregisterEndpoint('test-endpoint');

            expect(removed).toBe(true);
            expect(registry.getEndpoint('test-endpoint')).toBeUndefined();
        });

        it('should return false when unregistering non-existent endpoint', () => {
            const removed = registry.unregisterEndpoint('non-existent');
            expect(removed).toBe(false);
        });
    });

    describe('Endpoint Listing', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
            registry.registerHandler(EndpointType.SCRIPT, mockHandler);
        });

        it('should list all endpoints', () => {
            registry.registerEndpoint({
                id: 'endpoint-1',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/flow1',
                config: {},
            });

            registry.registerEndpoint({
                id: 'endpoint-2',
                type: EndpointType.SCRIPT,
                method: 'POST',
                path: '/api/script1',
                config: {},
            });

            const endpoints = registry.listEndpoints();
            expect(endpoints).toHaveLength(2);
        });

        it('should list endpoints by type', () => {
            registry.registerEndpoint({
                id: 'flow-1',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/flow1',
                config: {},
            });

            registry.registerEndpoint({
                id: 'flow-2',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/flow2',
                config: {},
            });

            registry.registerEndpoint({
                id: 'script-1',
                type: EndpointType.SCRIPT,
                method: 'POST',
                path: '/api/script1',
                config: {},
            });

            const flowEndpoints = registry.listEndpointsByType(EndpointType.FLOW);
            expect(flowEndpoints).toHaveLength(2);

            const scriptEndpoints = registry.listEndpointsByType(EndpointType.SCRIPT);
            expect(scriptEndpoints).toHaveLength(1);
        });
    });

    describe('Endpoint Enable/Disable', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
        });

        it('should enable endpoint', () => {
            registry.registerEndpoint({
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/test',
                enabled: false,
                config: {},
            });

            registry.enableEndpoint('test-endpoint');

            const endpoint = registry.getEndpoint('test-endpoint');
            expect(endpoint?.enabled).toBe(true);
        });

        it('should disable endpoint', () => {
            registry.registerEndpoint({
                id: 'test-endpoint',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/test',
                enabled: true,
                config: {},
            });

            registry.disableEndpoint('test-endpoint');

            const endpoint = registry.getEndpoint('test-endpoint');
            expect(endpoint?.enabled).toBe(false);
        });
    });

    describe('Loading from Config', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
        });

        it('should load multiple endpoints from config', async () => {
            const configs = [
                {
                    id: 'endpoint-1',
                    type: EndpointType.FLOW,
                    method: 'POST' as const,
                    path: '/api/flow1',
                    config: {},
                },
                {
                    id: 'endpoint-2',
                    type: EndpointType.FLOW,
                    method: 'POST' as const,
                    path: '/api/flow2',
                    config: {},
                },
            ];

            await registry.loadFromConfig(configs);

            expect(registry.listEndpoints()).toHaveLength(2);
        });

        it('should continue on error during batch load', async () => {
            const configs = [
                {
                    id: 'endpoint-1',
                    type: EndpointType.FLOW,
                    method: 'POST' as const,
                    path: '/api/flow1',
                    config: {},
                },
                {
                    id: '', // Invalid
                    type: EndpointType.FLOW,
                    method: 'POST' as const,
                    path: '/api/flow2',
                    config: {},
                },
                {
                    id: 'endpoint-3',
                    type: EndpointType.FLOW,
                    method: 'POST' as const,
                    path: '/api/flow3',
                    config: {},
                },
            ];

            await registry.loadFromConfig(configs);

            // Should load 2 valid endpoints despite 1 error
            expect(registry.listEndpoints()).toHaveLength(2);
        });
    });

    describe('Clear', () => {
        beforeEach(() => {
            registry.registerHandler(EndpointType.FLOW, mockHandler);
        });

        it('should clear all endpoints', () => {
            registry.registerEndpoint({
                id: 'endpoint-1',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/flow1',
                config: {},
            });

            registry.registerEndpoint({
                id: 'endpoint-2',
                type: EndpointType.FLOW,
                method: 'POST',
                path: '/api/flow2',
                config: {},
            });

            registry.clear();

            expect(registry.listEndpoints()).toHaveLength(0);
        });
    });
});
