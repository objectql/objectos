/**
 * TanStack Query hooks for CRUD record operations.
 *
 * Uses the official @objectstack/client SDK to fetch from the server.
 * Falls back to mock data only when the server is unreachable during development.
 * Supports optimistic updates for instant UI feedback.
 * Supports server-side pagination, sorting, and filtering (Phase H).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RecordData, RecordListResponse } from '@/types/metadata';
import { objectStackClient } from '@/lib/api';
import { getMockRecords, getMockRecord } from '@/lib/mock-data';

// ── Helpers ─────────────────────────────────────────────────────

/** Whether to use mock data as fallback (development only) */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

// ── Record list ─────────────────────────────────────────────────

export interface UseRecordsOptions {
  objectName: string | undefined;
  page?: number;
  pageSize?: number;
  /** Sort field name */
  sortField?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Filter conditions */
  filters?: Array<{ field: string; operator: string; value: string }>;
}

export function useRecords({
  objectName,
  page = 1,
  pageSize = 20,
  sortField,
  sortOrder,
  filters,
}: UseRecordsOptions) {
  return useQuery<RecordListResponse>({
    queryKey: ['records', objectName, page, pageSize, sortField, sortOrder, filters],
    queryFn: async () => {
      if (!objectName) return { records: [], total: 0, page, pageSize };
      try {
        const params: Record<string, unknown> = {
          top: pageSize,
          skip: (page - 1) * pageSize,
        };
        if (sortField) {
          params.orderby = sortOrder === 'desc' ? `${sortField} desc` : sortField;
        }
        if (filters?.length) {
          params.filter = filters.map(
            (f) => {
              // Sanitize: escape single quotes in values to prevent filter injection
              const safeValue = f.value.replace(/'/g, "''");
              return `${f.field} ${f.operator} '${safeValue}'`;
            },
          ).join(' and ');
        }
        const result = await objectStackClient.data.find(objectName, params);
        return {
          records: result.records ?? [],
          total: result.total ?? result.records?.length ?? 0,
          page,
          pageSize,
        };
      } catch {
        if (!USE_MOCK_FALLBACK) throw new Error(`Failed to fetch ${objectName} records`);
      }
      // Development fallback — mock data with client-side pagination
      const all = getMockRecords(objectName);
      const start = (page - 1) * pageSize;
      const records = all.slice(start, start + pageSize);
      return { records, total: all.length, page, pageSize };
    },
    enabled: !!objectName,
    retry: USE_MOCK_FALLBACK ? 0 : 2,
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
        if (!USE_MOCK_FALLBACK) throw new Error(`Failed to fetch ${objectName}/${recordId}`);
      }
      return getMockRecord(objectName, recordId);
    },
    enabled: !!objectName && !!recordId,
    retry: USE_MOCK_FALLBACK ? 0 : 2,
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
        (old) => old ? { ...old, records: [...old.records, { id: crypto.randomUUID(), ...newData } as RecordData], total: old.total + 1 } : old,
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
        (old) => {
          if (!old) return old;
          const filtered = old.records.filter((r) => String(r.id) !== recordId);
          const removed = filtered.length < old.records.length;
          return { ...old, records: filtered, total: removed ? Math.max(0, old.total - 1) : old.total };
        },
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
