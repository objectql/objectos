/**
 * TanStack Query hooks for CRUD record operations.
 *
 * Uses the official @objectstack/client SDK to fetch from the server.
 * Falls back to mock data when the server is unreachable.
 */

import { useQuery } from '@tanstack/react-query';
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
