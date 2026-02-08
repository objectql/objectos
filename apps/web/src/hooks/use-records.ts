/**
 * TanStack Query hooks for CRUD record operations.
 *
 * Uses mock data in development. When the server data endpoints
 * are available, swap the queryFn to call `apiFetch` instead.
 */

import { useQuery } from '@tanstack/react-query';
import type { RecordData, RecordListResponse } from '@/types/metadata';
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
    queryFn: () => {
      // TODO: replace with apiFetch<RecordListResponse>(`/data/${objectName}?page=${page}&pageSize=${pageSize}`)
      const all = objectName ? getMockRecords(objectName) : [];
      const start = (page - 1) * pageSize;
      const records = all.slice(start, start + pageSize);
      return Promise.resolve({
        records,
        total: all.length,
        page,
        pageSize,
      });
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
    queryFn: () => {
      // TODO: replace with apiFetch<RecordData>(`/data/${objectName}/${recordId}`)
      if (!objectName || !recordId) return Promise.resolve(undefined);
      return Promise.resolve(getMockRecord(objectName, recordId));
    },
    enabled: !!objectName && !!recordId,
  });
}
