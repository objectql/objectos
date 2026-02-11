/**
 * MutationQueue — buffer mutations when offline, sync on reconnect.
 *
 * Queues data mutations when the client is offline and automatically
 * replays them when connectivity is restored.
 *
 * Phase K — Task K.3
 */

import { useState, useEffect, useCallback } from 'react';

export interface QueuedMutation {
  id: string;
  objectName: string;
  recordId: string;
  type: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

const STORAGE_KEY = 'objectos:mutation-queue';

function loadQueue(): QueuedMutation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage may be full
  }
}

/**
 * useMutationQueue — manage the offline mutation queue.
 */
export function useMutationQueue() {
  const [queue, setQueue] = useState<QueuedMutation[]>(loadQueue);

  // Persist queue changes to localStorage
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const enqueue = useCallback(
    (
      objectName: string,
      recordId: string,
      type: 'create' | 'update' | 'delete',
      data: Record<string, unknown>,
    ) => {
      const mutation: QueuedMutation = {
        id: crypto.randomUUID(),
        objectName,
        recordId,
        type,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      };
      setQueue((prev) => [...prev, mutation]);
      return mutation.id;
    },
    [],
  );

  const dequeue = useCallback((mutationId: string) => {
    setQueue((prev) => prev.filter((m) => m.id !== mutationId));
  }, []);

  const markProcessing = useCallback((mutationId: string) => {
    setQueue((prev) =>
      prev.map((m) =>
        m.id === mutationId ? { ...m, status: 'processing' as const } : m,
      ),
    );
  }, []);

  const markFailed = useCallback((mutationId: string, error: string) => {
    setQueue((prev) =>
      prev.map((m) =>
        m.id === mutationId
          ? { ...m, status: 'failed' as const, error, retryCount: m.retryCount + 1 }
          : m,
      ),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((m) => m.status !== 'pending'));
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
  }, []);

  const pendingCount = queue.filter((m) => m.status === 'pending').length;
  const failedCount = queue.filter((m) => m.status === 'failed').length;

  return {
    queue,
    pendingCount,
    failedCount,
    enqueue,
    dequeue,
    markProcessing,
    markFailed,
    clearCompleted,
    clearAll,
  };
}
