/**
 * TanStack Query hooks for fetching object and app metadata.
 *
 * Uses the official @objectstack/client SDK to fetch from the server.
 * Falls back to mock data when the server is unreachable so the UI
 * can be developed without a running backend.
 */

import { useQuery } from '@tanstack/react-query';
import type { AppDefinition, ObjectDefinition } from '@/types/metadata';
import { objectStackClient } from '@/lib/api';
import { getMockAppDefinition, getMockObjectDefinition, mockAppDefinitions } from '@/lib/mock-data';

// ── App metadata ────────────────────────────────────────────────

export function useAppDefinition(appId: string | undefined) {
  return useQuery<AppDefinition | undefined>({
    queryKey: ['metadata', 'app', appId],
    queryFn: async () => {
      if (!appId) return undefined;
      try {
        const result = await objectStackClient.meta.getItem('app', appId);
        if (result) return result as AppDefinition;
      } catch {
        // Server unreachable — use mock data
      }
      return getMockAppDefinition(appId);
    },
    enabled: !!appId,
  });
}

export function useAppList() {
  return useQuery<AppDefinition[]>({
    queryKey: ['metadata', 'apps'],
    queryFn: async () => {
      try {
        const result = await objectStackClient.meta.getItems('app');
        if (result?.items?.length) return result.items as AppDefinition[];
      } catch {
        // Server unreachable — use mock data
      }
      return mockAppDefinitions;
    },
  });
}

// ── Object metadata ─────────────────────────────────────────────

export function useObjectDefinition(objectName: string | undefined) {
  return useQuery<ObjectDefinition | undefined>({
    queryKey: ['metadata', 'object', objectName],
    queryFn: async () => {
      if (!objectName) return undefined;
      try {
        const result = await objectStackClient.meta.getObject(objectName);
        if (result) return result as ObjectDefinition;
      } catch {
        // Server unreachable — use mock data
      }
      return getMockObjectDefinition(objectName);
    },
    enabled: !!objectName,
  });
}
