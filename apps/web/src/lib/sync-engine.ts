/**
 * Sync engine — client-side mutation log and delta sync.
 *
 * Implements a simple push/pull sync protocol:
 *  - **Push:** Local mutations are queued and sent to the server in order.
 *  - **Pull:** Server deltas (changes since a cursor) are fetched and merged.
 *  - **Conflict detection:** When server and client both modify the same record,
 *    a conflict is surfaced for manual resolution.
 */

// ── Types ───────────────────────────────────────────────────────

export type MutationType = 'create' | 'update' | 'delete';

export interface MutationEntry {
  id: string;
  objectName: string;
  recordId: string;
  type: MutationType;
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

export interface DeltaEntry {
  objectName: string;
  recordId: string;
  type: MutationType;
  data: Record<string, unknown>;
  serverTimestamp: number;
}

export interface SyncConflict {
  id: string;
  objectName: string;
  recordId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  localTimestamp: number;
  serverTimestamp: number;
  resolvedBy?: 'local' | 'server' | 'manual';
  resolvedData?: Record<string, unknown>;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  conflicts: SyncConflict[];
  lastSyncedAt: number | null;
  cursor: string | null;
}

// ── Sync Engine ─────────────────────────────────────────────────

let counter = 0;
function generateId(): string {
  return `mut_${Date.now()}_${++counter}`;
}

export class SyncEngine {
  private mutationLog: MutationEntry[] = [];
  private conflicts: SyncConflict[] = [];
  private cursor: string | null = null;
  private lastSyncedAt: number | null = null;
  private listeners = new Set<(state: SyncState) => void>();

  getState(): SyncState {
    return {
      status: navigator.onLine ? 'idle' : 'offline',
      pendingCount: this.mutationLog.filter((m) => !m.synced).length,
      conflicts: [...this.conflicts],
      lastSyncedAt: this.lastSyncedAt,
      cursor: this.cursor,
    };
  }

  /**
   * Queue a local mutation for sync.
   */
  pushMutation(
    objectName: string,
    recordId: string,
    type: MutationType,
    data: Record<string, unknown>,
  ): MutationEntry {
    const entry: MutationEntry = {
      id: generateId(),
      objectName,
      recordId,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };
    this.mutationLog.push(entry);
    this.notify();
    return entry;
  }

  /**
   * Attempt to push pending mutations to the server.
   */
  async pushToServer(
    sendFn: (
      mutations: MutationEntry[],
    ) => Promise<{ synced: string[]; conflicts: SyncConflict[] }>,
  ): Promise<void> {
    const pending = this.mutationLog.filter((m) => !m.synced);
    if (pending.length === 0) return;

    const result = await sendFn(pending);

    // Mark synced entries
    for (const id of result.synced) {
      const entry = this.mutationLog.find((m) => m.id === id);
      if (entry) entry.synced = true;
    }

    // Add any new conflicts
    if (result.conflicts.length > 0) {
      this.conflicts.push(...result.conflicts);
    }

    this.lastSyncedAt = Date.now();
    this.notify();
  }

  /**
   * Pull deltas from the server since the last cursor.
   */
  async pullFromServer(
    fetchFn: (cursor: string | null) => Promise<{ deltas: DeltaEntry[]; cursor: string }>,
  ): Promise<DeltaEntry[]> {
    const result = await fetchFn(this.cursor);
    this.cursor = result.cursor;
    this.lastSyncedAt = Date.now();
    this.notify();
    return result.deltas;
  }

  /**
   * Resolve a conflict by choosing local, server, or manually merged data.
   */
  resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual',
    manualData?: Record<string, unknown>,
  ): void {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    conflict.resolvedBy = resolution;
    switch (resolution) {
      case 'local':
        conflict.resolvedData = conflict.localData;
        break;
      case 'server':
        conflict.resolvedData = conflict.serverData;
        break;
      case 'manual':
        conflict.resolvedData = manualData ?? conflict.serverData;
        break;
    }

    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
    this.notify();
  }

  getPendingMutations(): MutationEntry[] {
    return this.mutationLog.filter((m) => !m.synced);
  }

  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  clearSyncedMutations(): void {
    this.mutationLog = this.mutationLog.filter((m) => !m.synced);
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}

/** Singleton sync engine instance */
export const syncEngine = new SyncEngine();
