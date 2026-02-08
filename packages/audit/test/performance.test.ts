/**
 * Performance Baseline Test Suite
 *
 * Measures P95 latency for core CRUD operations across the plugin pipeline.
 * Target: P95 < 100 ms for all operations.
 *
 * Measured operations:
 *   - Permission check (data.beforeCreate / beforeUpdate / beforeDelete / beforeFind)
 *   - Audit event recording (data.create / data.update / data.delete)
 *   - Audit query (queryEvents / getAuditTrail / getFieldHistory)
 */

import { AuditLogPlugin, getAuditLogAPI } from '../src/index.js';
import { PermissionsPlugin } from '@objectos/permissions';
import type { PluginContext } from '@objectstack/runtime';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

/** Compute P95 from a sorted array of numbers */
function p95(sorted: number[]): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.min(idx, sorted.length - 1)];
}

/** Retrieve the audit API or fail fast with a descriptive message */
function getAuditAPI(kernel: any): AuditLogPlugin {
    const api = getAuditLogAPI(kernel);
    if (!api) throw new Error('AuditLogPlugin not registered on kernel');
    return api;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ITERATIONS = 100;
const P95_THRESHOLD_MS = 100;

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('Performance Baseline (P95 < 100 ms)', () => {
    let auditPlugin: AuditLogPlugin;
    let permissionsPlugin: PermissionsPlugin;
    let hooks: Map<string, Function[]>;
    let kernel: any;

    beforeAll(async () => {
        const mock = createMockContext();
        hooks = mock.hooks;
        kernel = mock.kernel;

        permissionsPlugin = new PermissionsPlugin({ enabled: true, defaultDeny: false });
        await permissionsPlugin.init(mock.context);

        auditPlugin = new AuditLogPlugin({ enabled: true, trackFieldChanges: true });
        await auditPlugin.init(mock.context);
    });

    afterAll(async () => {
        await auditPlugin.destroy();
        await permissionsPlugin.destroy();
    });

    // ── CRUD write operations ──────────────────────────────────────────────────

    it(`data.create pipeline P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();

            await triggerHook(hooks, 'data.beforeCreate', {
                objectName: 'perf_test',
                userId: 'user-bench',
                userProfiles: ['admin'],
            });
            await triggerHook(hooks, 'data.create', {
                objectName: 'perf_test',
                recordId: `rec-${i}`,
                userId: 'user-bench',
                record: { id: `rec-${i}`, value: i },
            });

            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        // Log for visibility
        console.log(
            `  data.create — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });

    it(`data.update pipeline P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();

            await triggerHook(hooks, 'data.beforeUpdate', {
                objectName: 'perf_test',
                userId: 'user-bench',
                userProfiles: ['admin'],
                recordId: `rec-${i}`,
            });
            await triggerHook(hooks, 'data.update', {
                objectName: 'perf_test',
                recordId: `rec-${i}`,
                userId: 'user-bench',
                changes: { value: { oldValue: i, newValue: i + 1 } },
            });

            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        console.log(
            `  data.update — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });

    it(`data.delete pipeline P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();

            await triggerHook(hooks, 'data.beforeDelete', {
                objectName: 'perf_test',
                userId: 'user-bench',
                userProfiles: ['admin'],
                recordId: `rec-${i}`,
            });
            await triggerHook(hooks, 'data.delete', {
                objectName: 'perf_test',
                recordId: `rec-${i}`,
                userId: 'user-bench',
            });

            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        console.log(
            `  data.delete — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });

    // ── Read / query operations ────────────────────────────────────────────────

    it(`audit queryEvents P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const audit = getAuditAPI(kernel);
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await audit.queryEvents({ objectName: 'perf_test', limit: 10 });
            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        console.log(
            `  queryEvents — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });

    it(`audit getAuditTrail P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const audit = getAuditAPI(kernel);
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            await audit.getAuditTrail('perf_test', `rec-${i % 50}`);
            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        console.log(
            `  getAuditTrail — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });

    it(`permission check P95 should be < ${P95_THRESHOLD_MS} ms (n=${ITERATIONS})`, async () => {
        const durations: number[] = [];

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();

            await triggerHook(hooks, 'data.beforeFind', {
                objectName: 'perf_test',
                userId: 'user-bench',
                userProfiles: ['admin'],
            });

            durations.push(performance.now() - start);
        }

        durations.sort((a, b) => a - b);
        const p95Val = p95(durations);

        console.log(
            `  permission check — min: ${durations[0].toFixed(2)} ms, ` +
            `median: ${durations[Math.floor(durations.length / 2)].toFixed(2)} ms, ` +
            `P95: ${p95Val.toFixed(2)} ms`,
        );

        expect(p95Val).toBeLessThan(P95_THRESHOLD_MS);
    });
});
