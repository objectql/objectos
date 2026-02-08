/**
 * TanStack Query hooks for CRUD record operations.
 *
 * Uses the official @objectstack/client SDK to fetch from the server.
 * Falls back to mock data when the server is unreachable.
 * Supports optimistic updates for instant UI feedback (Phase 5).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RecordData, RecordListResponse } from '@/types/metadata';
import { objectStackClient } from '@/lib/api';
import { getMockRecords, getMockRecord } from '@/lib/mock-data';

// ── Record list ─────────────────────────────────────────────────

interface UseRecordsOptions {
  objectName: string | undefined;
  page?: number;
  pageSize?: number;
}

export function useRecords({ objectName, page = 1, pageSize = 20 }: UseRecordsOptions) {
  return useQuery<RecordListResponse>({
    queryKey: ['records', objectName, page, pageSize],
    queryFn: async () => {
      if (!objectName) return { records: [], total: 0, page, pageSize };
      try {
        const result = await objectStackClient.data.find(objectName, {
          top: pageSize,
          skip: (page - 1) * pageSize,
        });
        return {
          records: result.records ?? [],
          total: result.total ?? result.records?.length ?? 0,
          page,
          pageSize,
        };
      } catch {
        // Server unreachable — use mock data
      }
      const all = getMockRecords(objectName);
      const start = (page - 1) * pageSize;
      const records = all.slice(start, start + pageSize);
      return { records, total: all.length, page, pageSize };
    },
    enabled: !!objectName,
  });
}

// ── Single record ───────────────────────────────────────────────

interface UseRecordOptions {
  objectName: string | undefined;
  recordId: string | undefined;
}

export function useRecord({ objectName, recordId }: UseRecordOptions) {
  return useQuery<RecordData | undefined>({
    queryKey: ['record', objectName, recordId],
    queryFn: async () => {
      if (!objectName || !recordId) return undefined;
      try {
        const result = await objectStackClient.data.get(objectName, recordId);
        if (result?.record) return result.record as RecordData;
      } catch {
        // Server unreachable — use mock data
      }
      return getMockRecord(objectName, recordId);
    },
    enabled: !!objectName && !!recordId,
  });
}

// ── Optimistic update context types ─────────────────────────────

type QueryListSnapshot = [readonly unknown[], RecordListResponse | undefined][];

interface CreateMutationContext {
  previous: QueryListSnapshot;
}

interface UpdateMutationContext {
  previous: RecordData | undefined;
}

interface DeleteMutationContext {
  previous: QueryListSnapshot;
}

// ── Create record ───────────────────────────────────────────────

interface UseCreateRecordOptions {
  objectName: string;
}

export function useCreateRecord({ objectName }: UseCreateRecordOptions) {
  const queryClient = useQueryClient();

  return useMutation<RecordData, Error, Partial<RecordData>, CreateMutationContext>({
    mutationFn: async (data) => {
      const result = await objectStackClient.data.create(objectName, data);
      return (result?.record ?? data) as RecordData;
    },
    // Optimistic update: append the new record to the cached list immediately
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['records', objectName] });
      const previous = queryClient.getQueriesData<RecordListResponse>({ queryKey: ['records', objectName] });
      queryClient.setQueriesData<RecordListResponse>(
        { queryKey: ['records', objectName] },
        (old) => old ? { ...old, records: [...old.records, { id: `optimistic-${Date.now()}`, ...newData } as RecordData], total: old.total + 1 } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
    },
  });
}

// ── Update record ───────────────────────────────────────────────

interface UseUpdateRecordOptions {
  objectName: string;
  recordId: string;
}

export function useUpdateRecord({ objectName, recordId }: UseUpdateRecordOptions) {
  const queryClient = useQueryClient();

  return useMutation<RecordData, Error, Partial<RecordData>, UpdateMutationContext>({
    mutationFn: async (data) => {
      const result = await objectStackClient.data.update(objectName, recordId, data);
      return (result?.record ?? data) as RecordData;
    },
    // Optimistic update: merge changes into the cached record immediately
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['record', objectName, recordId] });
      const previous = queryClient.getQueryData<RecordData>(['record', objectName, recordId]);
      queryClient.setQueryData<RecordData>(
        ['record', objectName, recordId],
        (old) => old ? { ...old, ...newData } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['record', objectName, recordId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
      void queryClient.invalidateQueries({ queryKey: ['record', objectName, recordId] });
    },
  });
}

// ── Delete record ───────────────────────────────────────────────

interface UseDeleteRecordOptions {
  objectName: string;
}

export function useDeleteRecord({ objectName }: UseDeleteRecordOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, DeleteMutationContext>({
    mutationFn: async (recordId) => {
      await objectStackClient.data.delete(objectName, recordId);
    },
    // Optimistic update: remove the record from the cached list immediately
    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['records', objectName] });
      const previous = queryClient.getQueriesData<RecordListResponse>({ queryKey: ['records', objectName] });
      queryClient.setQueriesData<RecordListResponse>(
        { queryKey: ['records', objectName] },
        (old) => old ? { ...old, records: old.records.filter((r) => String(r.id) !== recordId), total: Math.max(0, old.total - 1) } : old,
      );
      return { previous };
    },
    onError: (_err, _recordId, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_data, _err, recordId) => {
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
      void queryClient.removeQueries({ queryKey: ['record', objectName, recordId] });
    },
  });
}
