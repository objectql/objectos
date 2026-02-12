/**
 * Plugin Watchdog
 *
 * Monitors the health of isolated plugin hosts (worker or process) via
 * periodic heartbeat pings. Automatically restarts failed plugins with
 * exponential backoff up to a configurable maximum restart count.
 */

import type { PluginHost, PluginHostStatus, WatchdogConfig } from './types.js';

/** Internal state tracked per watched host */
interface WatchedHost {
    host: PluginHost;
    restarts: number;
    lastHeartbeat?: string;
    heartbeatTimer?: ReturnType<typeof setInterval>;
    restarting: boolean;
}

/**
 * Monitors plugin host health and performs automatic restarts.
 *
 * @example
 * ```ts
 * const watchdog = new PluginWatchdog({
 *   maxRestarts: 5,
 *   backoffMs: 1000,
 *   heartbeatIntervalMs: 10_000,
 *   heartbeatTimeoutMs: 5_000,
 * });
 *
 * const host = new WorkerThreadPluginHost({ ... });
 * await host.start();
 * watchdog.watch(host);
 *
 * // Later
 * watchdog.destroy();
 * ```
 */
export class PluginWatchdog {
    private readonly maxRestarts: number;
    private readonly backoffMs: number;
    private readonly heartbeatIntervalMs: number;
    private readonly heartbeatTimeoutMs: number;

    private watched = new Map<PluginHost, WatchedHost>();
    private destroyed = false;

    constructor(config: WatchdogConfig = {}) {
        this.maxRestarts = config.maxRestarts ?? 5;
        this.backoffMs = config.backoffMs ?? 1000;
        this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 10_000;
        this.heartbeatTimeoutMs = config.heartbeatTimeoutMs ?? 5_000;
    }

    /**
     * Start monitoring a plugin host
     */
    watch(host: PluginHost): void {
        if (this.destroyed) {
            throw new Error('Watchdog has been destroyed');
        }

        if (this.watched.has(host)) {
            return;
        }

        const entry: WatchedHost = {
            host,
            restarts: 0,
            restarting: false,
        };

        entry.heartbeatTimer = setInterval(() => {
            void this.checkHealth(entry);
        }, this.heartbeatIntervalMs);

        this.watched.set(host, entry);
    }

    /**
     * Stop monitoring a plugin host
     */
    unwatch(host: PluginHost): void {
        const entry = this.watched.get(host);
        if (!entry) return;

        if (entry.heartbeatTimer) {
            clearInterval(entry.heartbeatTimer);
        }
        this.watched.delete(host);
    }

    /**
     * Get the status of all watched hosts
     */
    getStatus(): Map<PluginHost, PluginHostStatus> {
        const result = new Map<PluginHost, PluginHostStatus>();

        for (const [host, entry] of this.watched) {
            result.set(host, {
                alive: host.isAlive(),
                restarts: entry.restarts,
                lastHeartbeat: entry.lastHeartbeat,
                isolation: host.config.isolation,
            });
        }

        return result;
    }

    /**
     * Stop all monitoring and clean up timers
     */
    destroy(): void {
        this.destroyed = true;

        for (const [, entry] of this.watched) {
            if (entry.heartbeatTimer) {
                clearInterval(entry.heartbeatTimer);
            }
        }

        this.watched.clear();
    }

    // ─── Private ────────────────────────────────────────────────────────────────

    /**
     * Check health of a single host via heartbeat
     */
    private async checkHealth(entry: WatchedHost): Promise<void> {
        if (this.destroyed || entry.restarting) {
            return;
        }

        const host = entry.host;

        // If the host reports not alive, attempt restart immediately
        if (!host.isAlive()) {
            await this.attemptRestart(entry);
            return;
        }

        // Send heartbeat — the host must implement heartbeat()
        const hostWithHeartbeat = host as PluginHost & {
            heartbeat?(timeoutMs: number): Promise<boolean>;
        };

        if (typeof hostWithHeartbeat.heartbeat === 'function') {
            const ok = await hostWithHeartbeat.heartbeat(this.heartbeatTimeoutMs);
            if (ok) {
                entry.lastHeartbeat = new Date().toISOString();
            } else {
                await this.attemptRestart(entry);
            }
        } else {
            // No heartbeat support — just track alive status
            if (host.isAlive()) {
                entry.lastHeartbeat = new Date().toISOString();
            }
        }
    }

    /**
     * Attempt to restart a host with exponential backoff
     */
    private async attemptRestart(entry: WatchedHost): Promise<void> {
        if (entry.restarting) return;

        if (entry.restarts >= this.maxRestarts) {
            // Max restarts exceeded — stop watching
            this.unwatch(entry.host);
            return;
        }

        entry.restarting = true;
        entry.restarts++;

        // Exponential backoff: backoffMs * 2^(restarts-1)
        const delay = this.backoffMs * Math.pow(2, entry.restarts - 1);
        await this.sleep(delay);

        if (this.destroyed) {
            entry.restarting = false;
            return;
        }

        try {
            await entry.host.restart();
            entry.lastHeartbeat = new Date().toISOString();
        } catch {
            // Restart failed — will retry on next heartbeat interval
        } finally {
            entry.restarting = false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
