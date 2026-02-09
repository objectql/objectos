/**
 * Tests for sync-engine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine } from '@/lib/sync-engine';

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    engine = new SyncEngine();
  });

  it('starts with idle state and no pending mutations', () => {
    const state = engine.getState();
    expect(state.pendingCount).toBe(0);
    expect(state.conflicts).toEqual([]);
    expect(state.lastSyncedAt).toBeNull();
    expect(state.cursor).toBeNull();
  });

  it('pushMutation adds to pending count', () => {
    engine.pushMutation('accounts', 'acc-1', 'update', { name: 'Acme' });
    expect(engine.getState().pendingCount).toBe(1);

    engine.pushMutation('accounts', 'acc-2', 'create', { name: 'Beta' });
    expect(engine.getState().pendingCount).toBe(2);
  });

  it('pushMutation returns a MutationEntry with correct properties', () => {
    const entry = engine.pushMutation('contacts', 'ct-1', 'create', { email: 'a@b.com' });
    expect(entry.objectName).toBe('contacts');
    expect(entry.recordId).toBe('ct-1');
    expect(entry.type).toBe('create');
    expect(entry.data).toEqual({ email: 'a@b.com' });
    expect(entry.synced).toBe(false);
    expect(entry.id).toMatch(/^mut_/);
  });

  it('getPendingMutations returns only unsynced entries', () => {
    engine.pushMutation('deals', 'd-1', 'update', { stage: 'won' });
    engine.pushMutation('deals', 'd-2', 'delete', {});
    expect(engine.getPendingMutations()).toHaveLength(2);
  });

  it('pushToServer marks synced entries and updates lastSyncedAt', async () => {
    const m1 = engine.pushMutation('accounts', 'a-1', 'create', { name: 'A' });
    const m2 = engine.pushMutation('accounts', 'a-2', 'create', { name: 'B' });

    await engine.pushToServer(async (mutations) => {
      expect(mutations).toHaveLength(2);
      return { synced: [m1.id, m2.id], conflicts: [] };
    });

    expect(engine.getState().pendingCount).toBe(0);
    expect(engine.getState().lastSyncedAt).toBeGreaterThan(0);
  });

  it('pushToServer adds conflicts when returned', async () => {
    engine.pushMutation('accounts', 'a-1', 'update', { name: 'Local' });

    await engine.pushToServer(async () => ({
      synced: [],
      conflicts: [
        {
          id: 'conflict-1',
          objectName: 'accounts',
          recordId: 'a-1',
          localData: { name: 'Local' },
          serverData: { name: 'Server' },
          localTimestamp: Date.now(),
          serverTimestamp: Date.now(),
        },
      ],
    }));

    expect(engine.getConflicts()).toHaveLength(1);
    expect(engine.getConflicts()[0].id).toBe('conflict-1');
  });

  it('resolveConflict with local keeps localData', () => {
    engine.pushMutation('accounts', 'a-1', 'update', { name: 'Local' });

    // Manually inject a conflict
    engine['conflicts'].push({
      id: 'c-1',
      objectName: 'accounts',
      recordId: 'a-1',
      localData: { name: 'Local' },
      serverData: { name: 'Server' },
      localTimestamp: Date.now(),
      serverTimestamp: Date.now(),
    });

    engine.resolveConflict('c-1', 'local');
    expect(engine.getConflicts()).toHaveLength(0);
  });

  it('resolveConflict with server keeps serverData', () => {
    engine['conflicts'].push({
      id: 'c-2',
      objectName: 'contacts',
      recordId: 'ct-1',
      localData: { email: 'local@test.com' },
      serverData: { email: 'server@test.com' },
      localTimestamp: Date.now(),
      serverTimestamp: Date.now(),
    });

    engine.resolveConflict('c-2', 'server');
    expect(engine.getConflicts()).toHaveLength(0);
  });

  it('pullFromServer updates cursor and lastSyncedAt', async () => {
    const deltas = await engine.pullFromServer(async (cursor) => {
      expect(cursor).toBeNull();
      return {
        deltas: [{ objectName: 'accounts', recordId: 'a-1', type: 'update' as const, data: { name: 'Updated' }, serverTimestamp: Date.now() }],
        cursor: 'cursor-1',
      };
    });

    expect(deltas).toHaveLength(1);
    expect(engine.getState().cursor).toBe('cursor-1');
    expect(engine.getState().lastSyncedAt).toBeGreaterThan(0);
  });

  it('subscribe notifies on state changes', () => {
    const states: number[] = [];
    engine.subscribe((state) => states.push(state.pendingCount));

    engine.pushMutation('x', 'y', 'create', {});
    engine.pushMutation('x', 'z', 'create', {});

    expect(states).toEqual([1, 2]);
  });

  it('clearSyncedMutations removes synced entries', async () => {
    const m = engine.pushMutation('a', '1', 'create', {});
    engine.pushMutation('a', '2', 'create', {});

    await engine.pushToServer(async () => ({ synced: [m.id], conflicts: [] }));
    engine.clearSyncedMutations();

    expect(engine.getPendingMutations()).toHaveLength(1);
  });
});
