/**
 * Worker Thread Plugin Host (Level 1 Isolation)
 *
 * Loads a plugin inside a Node.js worker_threads Worker, providing memory
 * isolation via V8 resource limits and communication through MessagePort
 * serialization. Implements the PluginHost interface for uniform management.
 */

import { Worker, type ResourceLimits } from 'node:worker_threads';
import { resolve } from 'node:path';
import type { PluginHost, PluginHostConfig } from './types.js';

interface PendingCall {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
}

/**
 * Hosts a plugin inside a worker_threads Worker.
 *
 * @example
 * ```ts
 * const host = new WorkerThreadPluginHost({
 *   pluginPath: '/abs/path/to/plugin.js',
 *   isolation: 'worker',
 *   resourceLimits: { maxOldGenerationSizeMb: 128 },
 * });
 * await host.start();
 * const result = await host.call('greet', ['world']);
 * await host.stop();
 * ```
 */
export class WorkerThreadPluginHost implements PluginHost {
    readonly config: PluginHostConfig;

    private worker: Worker | null = null;
    private pendingCalls = new Map<string, PendingCall>();
    private callCounter = 0;
    private alive = false;

    /** Default timeout for RPC calls (ms) */
    private readonly callTimeoutMs: number;

    /** Path to the worker entry script */
    private readonly workerEntry: string;

    constructor(config: PluginHostConfig, options?: { callTimeoutMs?: number; workerEntry?: string }) {
        this.config = { ...config, isolation: 'worker' };
        this.callTimeoutMs = options?.callTimeoutMs ?? 30_000;
        this.workerEntry = options?.workerEntry ?? resolve(__dirname, 'worker-entry.js');
    }

    /**
     * Start the worker thread and wait for the plugin to signal readiness
     */
    async start(): Promise<void> {
        if (this.worker) {
            throw new Error('Worker is already running');
        }

        const resourceLimits: ResourceLimits | undefined = this.config.resourceLimits
            ? {
                maxOldGenerationSizeMb: this.config.resourceLimits.maxOldGenerationSizeMb,
                maxYoungGenerationSizeMb: this.config.resourceLimits.maxYoungGenerationSizeMb,
                codeRangeSizeMb: this.config.resourceLimits.codeRangeSizeMb,
                stackSizeMb: this.config.resourceLimits.stackSizeMb,
              }
            : undefined;

        return new Promise<void>((resolveStart, rejectStart) => {
            this.worker = new Worker(this.workerEntry, {
                workerData: { pluginPath: this.config.pluginPath },
                resourceLimits,
            });

            const onReady = (msg: { type: string; error?: string }) => {
                if (msg.type === 'ready') {
                    this.alive = true;
                    this.worker!.off('message', onReady);
                    this.worker!.on('message', this.handleMessage.bind(this));
                    resolveStart();
                } else if (msg.type === 'error') {
                    rejectStart(new Error(`Worker init failed: ${msg.error}`));
                }
            };

            this.worker.on('message', onReady);

            this.worker.on('error', (err: Error) => {
                this.alive = false;
                this.rejectAllPending(err);
            });

            this.worker.on('exit', (code) => {
                this.alive = false;
                if (code !== 0) {
                    this.rejectAllPending(new Error(`Worker exited with code ${code}`));
                }
            });
        });
    }

    /**
     * Gracefully stop the worker thread
     */
    async stop(): Promise<void> {
        if (!this.worker) {
            return;
        }
        this.rejectAllPending(new Error('Worker is being stopped'));
        await this.worker.terminate();
        this.worker = null;
        this.alive = false;
    }

    /**
     * Call a method on the remote plugin
     */
    async call(method: string, args?: unknown[]): Promise<unknown> {
        if (!this.worker || !this.alive) {
            throw new Error('Worker is not running');
        }

        const callId = `w-${++this.callCounter}`;

        return new Promise<unknown>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(callId);
                reject(new Error(`Call "${method}" timed out after ${this.callTimeoutMs}ms`));
            }, this.callTimeoutMs);

            this.pendingCalls.set(callId, { resolve, reject, timer });
            this.worker!.postMessage({ type: 'call', callId, method, args: args ?? [] });
        });
    }

    /**
     * Check if the worker is alive
     */
    isAlive(): boolean {
        return this.alive;
    }

    /**
     * Restart the worker thread
     */
    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    /**
     * Send a heartbeat ping and wait for acknowledgement
     */
    async heartbeat(timeoutMs = 5000): Promise<boolean> {
        if (!this.worker || !this.alive) {
            return false;
        }

        const callId = `hb-${++this.callCounter}`;

        return new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(callId);
                resolve(false);
            }, timeoutMs);

            this.pendingCalls.set(callId, {
                resolve: () => {
                    clearTimeout(timer);
                    resolve(true);
                },
                reject: () => {
                    clearTimeout(timer);
                    resolve(false);
                },
                timer,
            });

            this.worker!.postMessage({ type: 'heartbeat', callId });
        });
    }

    // ─── Private ────────────────────────────────────────────────────────────────

    private handleMessage(msg: { type: string; callId?: string; result?: unknown; error?: string }): void {
        if (msg.type === 'result' || msg.type === 'heartbeat-ack') {
            const pending = this.pendingCalls.get(msg.callId!);
            if (!pending) return;

            this.pendingCalls.delete(msg.callId!);
            clearTimeout(pending.timer);

            if (msg.type === 'heartbeat-ack') {
                pending.resolve(true);
            } else if (msg.error) {
                pending.reject(new Error(msg.error));
            } else {
                pending.resolve(msg.result);
            }
        }
    }

    private rejectAllPending(error: Error): void {
        for (const [id, pending] of this.pendingCalls) {
            clearTimeout(pending.timer);
            pending.reject(error);
            this.pendingCalls.delete(id);
        }
    }
}
