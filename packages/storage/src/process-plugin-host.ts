/**
 * Child Process Plugin Host (Level 2 Isolation)
 *
 * Loads a plugin inside a child_process.fork(), providing full process-level
 * isolation including separate V8 heap and native resources. Communication
 * happens via Node.js IPC channel (JSON serialization).
 */

import { fork, type ChildProcess } from 'node:child_process';
import type { PluginHost, PluginHostConfig } from './types.js';

interface PendingCall {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
}

/**
 * Hosts a plugin inside a child process via fork().
 *
 * @example
 * ```ts
 * const host = new ChildProcessPluginHost({
 *   pluginPath: '/abs/path/to/plugin.js',
 *   isolation: 'process',
 * });
 * await host.start();
 * const result = await host.call('greet', ['world']);
 * await host.stop();
 * ```
 */
export class ChildProcessPluginHost implements PluginHost {
    readonly config: PluginHostConfig;

    private child: ChildProcess | null = null;
    private pendingCalls = new Map<string, PendingCall>();
    private callCounter = 0;
    private alive = false;

    /** Default timeout for RPC calls (ms) */
    private readonly callTimeoutMs: number;

    /** Path to the process entry script */
    private readonly processEntry: string;

    constructor(config: PluginHostConfig, options?: { callTimeoutMs?: number; processEntry?: string }) {
        this.config = { ...config, isolation: 'process' };
        this.callTimeoutMs = options?.callTimeoutMs ?? 30_000;
        // Process entry must be provided explicitly or resolved by the caller.
        // In ESM, __dirname is not available — callers should use
        // `new URL('./process-entry.js', import.meta.url).pathname` to resolve.
        this.processEntry = options?.processEntry ?? 'process-entry.js';
    }

    /**
     * Start the child process and wait for the plugin to signal readiness
     */
    async start(): Promise<void> {
        if (this.child) {
            throw new Error('Child process is already running');
        }

        const execArgv: string[] = [];

        // Apply V8 resource limits via --max-old-space-size
        if (this.config.resourceLimits?.maxOldGenerationSizeMb) {
            execArgv.push(`--max-old-space-size=${this.config.resourceLimits.maxOldGenerationSizeMb}`);
        }
        if (this.config.resourceLimits?.stackSizeMb) {
            execArgv.push(`--stack-size=${this.config.resourceLimits.stackSizeMb * 1024}`);
        }

        return new Promise<void>((resolveStart, rejectStart) => {
            this.child = fork(this.processEntry, [this.config.pluginPath], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                execArgv,
            });

            const onReady = (msg: { type: string; error?: string }) => {
                if (msg.type === 'ready') {
                    this.alive = true;
                    this.child!.off('message', onReady);
                    this.child!.on('message', this.handleMessage.bind(this));
                    resolveStart();
                } else if (msg.type === 'error') {
                    rejectStart(new Error(`Child process init failed: ${msg.error}`));
                }
            };

            this.child.on('message', onReady);

            this.child.on('error', (err: Error) => {
                this.alive = false;
                this.rejectAllPending(err);
            });

            this.child.on('exit', (code) => {
                this.alive = false;
                if (code !== 0) {
                    this.rejectAllPending(new Error(`Child process exited with code ${code}`));
                }
            });
        });
    }

    /**
     * Gracefully stop the child process
     */
    async stop(): Promise<void> {
        if (!this.child) {
            return;
        }

        this.rejectAllPending(new Error('Child process is being stopped'));

        return new Promise<void>((resolve) => {
            const killTimer = setTimeout(() => {
                this.child?.kill('SIGKILL');
            }, 5000);

            this.child!.once('exit', () => {
                clearTimeout(killTimer);
                this.child = null;
                this.alive = false;
                resolve();
            });

            this.child!.kill('SIGTERM');
        });
    }

    /**
     * Call a method on the remote plugin
     */
    async call(method: string, args?: unknown[]): Promise<unknown> {
        if (!this.child || !this.alive) {
            throw new Error('Child process is not running');
        }

        const callId = `p-${++this.callCounter}`;

        return new Promise<unknown>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(callId);
                reject(new Error(`Call "${method}" timed out after ${this.callTimeoutMs}ms`));
            }, this.callTimeoutMs);

            this.pendingCalls.set(callId, { resolve, reject, timer });
            this.child!.send({ type: 'call', callId, method, args: args ?? [] });
        });
    }

    /**
     * Check if the child process is alive
     */
    isAlive(): boolean {
        return this.alive;
    }

    /**
     * Restart the child process
     */
    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    /**
     * Send a heartbeat ping and wait for acknowledgement
     */
    async heartbeat(timeoutMs = 5000): Promise<boolean> {
        if (!this.child || !this.alive) {
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

            this.child!.send({ type: 'heartbeat', callId });
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
