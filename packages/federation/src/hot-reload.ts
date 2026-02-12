// ---------------------------------------------------------------------------
// @objectos/federation — O.5.4 Hot-Reload Support
// ---------------------------------------------------------------------------

import type { HotReloadEvent } from './types.js';

type ReloadCallback = (event: HotReloadEvent) => void | Promise<void>;

export class HotReloadManager {
  private watching = false;
  private callbacks: ReloadCallback[] = [];
  private history: HotReloadEvent[] = [];
  private port: number;

  constructor(port?: number) {
    this.port = port ?? 9100;
  }

  /**
   * Start watching for remote changes.
   */
  start(port?: number): void {
    if (port !== undefined) {
      this.port = port;
    }
    this.watching = true;
  }

  /**
   * Stop watching.
   */
  stop(): void {
    this.watching = false;
  }

  /**
   * Notify that a remote has changed.
   */
  async notifyChange(remoteName: string): Promise<void> {
    const event: HotReloadEvent = {
      type: 'change',
      remoteName,
      timestamp: Date.now(),
    };
    this.history.push(event);
    await this.emit(event);
  }

  /**
   * Register a reload callback.
   */
  onReload(callback: ReloadCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get the full reload event history.
   */
  getReloadHistory(): HotReloadEvent[] {
    return [...this.history];
  }

  /**
   * Check if the manager is actively watching.
   */
  isWatching(): boolean {
    return this.watching;
  }

  /**
   * Get the configured port.
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Trigger a hot reload for a specific remote.
   * Emits an 'add' event if it's a first-time load, or 'change' if already known.
   */
  async triggerReload(remoteName: string): Promise<HotReloadEvent> {
    const existingEvent = this.history.find((e) => e.remoteName === remoteName);
    const event: HotReloadEvent = {
      type: existingEvent ? 'change' : 'add',
      remoteName,
      timestamp: Date.now(),
    };
    this.history.push(event);
    await this.emit(event);
    return event;
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async emit(event: HotReloadEvent): Promise<void> {
    for (const cb of this.callbacks) {
      try {
        await cb(event);
      } catch {
        // Callbacks must not crash the manager
      }
    }
  }
}
