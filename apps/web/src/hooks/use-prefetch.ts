/**
 * usePrefetch — prefetch data for linked pages.
 *
 * Pre-fetches metadata and records for pages the user is likely
 * to navigate to, improving perceived performance.
 *
 * Phase L — Task L.2
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { objectStackClient } from '@/lib/api';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchObjectDefinition = useCallback(
    (objectName: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['objectDefinition', objectName],
        queryFn: () => objectStackClient.meta.getObject(objectName),
        staleTime: 60_000, // 1 minute
      });
    },
    [queryClient],
  );

  const prefetchRecords = useCallback(
    (objectName: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['records', objectName, { page: 1, pageSize: 20 }],
        queryFn: () => objectStackClient.data.list(objectName, { limit: 20, skip: 0 }),
        staleTime: 30_000, // 30 seconds
      });
    },
    [queryClient],
  );

  const prefetchRecord = useCallback(
    (objectName: string, recordId: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['record', objectName, recordId],
        queryFn: () => objectStackClient.data.get(objectName, recordId),
        staleTime: 30_000,
      });
    },
    [queryClient],
  );

  return {
    prefetchObjectDefinition,
    prefetchRecords,
    prefetchRecord,
  };
}
