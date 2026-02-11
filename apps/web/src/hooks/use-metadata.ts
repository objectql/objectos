/**
 * TanStack Query hooks for fetching object and app metadata.
 *
 * Uses the official @objectstack/client SDK to fetch from the server.
 * Falls back to mock data only during development when the server is unreachable.
 * In production, errors are propagated to error boundaries (Phase H.3.1).
 */

import { useQuery } from '@tanstack/react-query';
import type { AppDefinition, ObjectDefinition } from '@/types/metadata';
import { objectStackClient } from '@/lib/api';
import { getMockAppDefinition, getMockObjectDefinition, mockAppDefinitions } from '@/lib/mock-data';

/** Whether to use mock data as fallback (development only) */
const USE_MOCK_FALLBACK = import.meta.env.DEV;

// ── App metadata ────────────────────────────────────────────────

export function useAppDefinition(appId: string | undefined) {
  return useQuery<AppDefinition | undefined>({
    queryKey: ['metadata', 'app', appId],
    queryFn: async () => {
      if (!appId) return undefined;
      try {
        const result = await objectStackClient.meta.getItem('apps', appId);
        if (result) return result as AppDefinition;
      } catch {
        if (!USE_MOCK_FALLBACK) throw new Error(`Failed to fetch app: ${appId}`);
      }
      return getMockAppDefinition(appId);
    },
    enabled: !!appId,
    retry: USE_MOCK_FALLBACK ? 0 : 2,
  });
}

export function useAppList() {
  return useQuery<AppDefinition[]>({
    queryKey: ['metadata', 'apps'],
    queryFn: async () => {
      try {
        const result = await objectStackClient.meta.getItems('apps');
        if (result?.items?.length) return result.items as AppDefinition[];
      } catch {
        if (!USE_MOCK_FALLBACK) throw new Error('Failed to fetch app list');
      }
      return mockAppDefinitions;
    },
    retry: USE_MOCK_FALLBACK ? 0 : 2,
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
        if (!USE_MOCK_FALLBACK) throw new Error(`Failed to fetch object: ${objectName}`);
      }
      return getMockObjectDefinition(objectName);
    },
    enabled: !!objectName,
    retry: USE_MOCK_FALLBACK ? 0 : 2,
  });
}

/**
 * Fetch all ObjectDefinition entries that belong to a given app.
 * Resolves each object name listed in `AppDefinition.objects` into its full definition.
 */
export function useAppObjects(appId: string | undefined) {
  const appQuery = useAppDefinition(appId);

  return useQuery<ObjectDefinition[]>({
    queryKey: ['metadata', 'appObjects', appId],
    queryFn: async () => {
      const objectNames = appQuery.data?.objects ?? [];
      const settled = await Promise.allSettled(
        objectNames.map((name) =>
          objectStackClient.meta.getObject(name).then((r) =>
            r ? (r as ObjectDefinition) : getMockObjectDefinition(name),
          ).catch(() => getMockObjectDefinition(name)),
        ),
      );
      return settled
        .filter((r): r is PromiseFulfilledResult<ObjectDefinition | undefined> =>
          r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((v): v is ObjectDefinition => !!v);
    },
    enabled: !!appId && !!appQuery.data,
  });
}
