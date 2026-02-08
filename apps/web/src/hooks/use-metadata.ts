/**
 * TanStack Query hooks for fetching object and app metadata.
 *
 * Uses mock data in development. When the server metadata endpoints
 * are available, swap the queryFn to call `apiFetch` instead.
 */

import { useQuery } from '@tanstack/react-query';
import type { AppDefinition, ObjectDefinition } from '@/types/metadata';
import { getMockAppDefinition, getMockObjectDefinition, mockAppDefinitions } from '@/lib/mock-data';

// ── App metadata ────────────────────────────────────────────────

export function useAppDefinition(appId: string | undefined) {
  return useQuery<AppDefinition | undefined>({
    queryKey: ['metadata', 'app', appId],
    queryFn: () => {
      // TODO: replace with apiFetch<AppDefinition>(`/metadata/apps/${appId}`)
      return Promise.resolve(appId ? getMockAppDefinition(appId) : undefined);
    },
    enabled: !!appId,
  });
}

export function useAppList() {
  return useQuery<AppDefinition[]>({
    queryKey: ['metadata', 'apps'],
    queryFn: () => {
      // TODO: replace with apiFetch<AppDefinition[]>('/metadata/apps')
      return Promise.resolve(mockAppDefinitions);
    },
  });
}

// ── Object metadata ─────────────────────────────────────────────

export function useObjectDefinition(objectName: string | undefined) {
  return useQuery<ObjectDefinition | undefined>({
    queryKey: ['metadata', 'object', objectName],
    queryFn: () => {
      // TODO: replace with apiFetch<ObjectDefinition>(`/metadata/objects/${objectName}`)
      return Promise.resolve(objectName ? getMockObjectDefinition(objectName) : undefined);
    },
    enabled: !!objectName,
  });
}
