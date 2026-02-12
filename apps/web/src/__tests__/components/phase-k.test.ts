/**
 * Tests for Phase K components — Offline & Sync.
 *
 * Validates exports of all Phase K sync components and hooks.
 */
import { describe, it, expect } from 'vitest';
import { SyncStatusBar } from '@/components/sync/SyncStatusBar';
import { SelectiveSyncPanel } from '@/components/sync/SelectiveSyncPanel';
import { useServiceWorker } from '@/lib/service-worker-manager';
import { useMutationQueue } from '@/hooks/use-mutation-queue';

describe('Phase K component exports', () => {
  it('exports SyncStatusBar (K.5)', () => {
    expect(SyncStatusBar).toBeTypeOf('function');
  });

  it('exports SelectiveSyncPanel (K.6)', () => {
    expect(SelectiveSyncPanel).toBeTypeOf('function');
  });

  it('exports useServiceWorker (K.1)', () => {
    expect(useServiceWorker).toBeTypeOf('function');
  });

  it('exports useMutationQueue (K.3)', () => {
    expect(useMutationQueue).toBeTypeOf('function');
  });
});
