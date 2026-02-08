/**
 * useSyncEngine — hook for the sync engine.
 *
 * Provides reactive access to sync state including pending mutations,
 * conflict count, and sync status. Wraps the singleton SyncEngine.
 */

import { useState, useEffect, useCallback } from 'react';
import { syncEngine, type SyncState, type SyncConflict } from '@/lib/sync-engine';

export function useSyncEngine() {
  const [state, setState] = useState<SyncState>(syncEngine.getState());

  useEffect(() => {
    return syncEngine.subscribe(setState);
  }, []);

  const pushMutation = useCallback(
    (objectName: string, recordId: string, type: 'create' | 'update' | 'delete', data: Record<string, unknown>) => {
      return syncEngine.pushMutation(objectName, recordId, type, data);
    },
    [],
  );

  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'local' | 'server' | 'manual', manualData?: Record<string, unknown>) => {
      syncEngine.resolveConflict(conflictId, resolution, manualData);
    },
    [],
  );

  const getConflicts = useCallback((): SyncConflict[] => {
    return syncEngine.getConflicts();
  }, []);

  return {
    ...state,
    pushMutation,
    resolveConflict,
    getConflicts,
  };
}
