/**
 * useSavedViews — manage saved filter/view configurations per object.
 *
 * Persists saved views in localStorage keyed by object name.
 * Provides CRUD operations for saved filter configurations.
 *
 * Phase I — Task I.3
 */

import { useState, useCallback, useEffect } from 'react';
import type { SavedView } from '@/components/objectui/SavedViewsPanel';

const STORAGE_KEY_PREFIX = 'objectos:saved-views:';

export function useSavedViews(objectName: string | undefined) {
  const storageKey = objectName ? `${STORAGE_KEY_PREFIX}${objectName}` : '';

  const [views, setViews] = useState<SavedView[]>(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync with localStorage when objectName changes
  useEffect(() => {
    if (!storageKey) {
      setViews([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setViews(stored ? JSON.parse(stored) : []);
    } catch {
      setViews([]);
    }
  }, [storageKey]);

  const persist = useCallback(
    (updated: SavedView[]) => {
      if (!storageKey) return;
      setViews(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // localStorage may be full or unavailable
      }
    },
    [storageKey],
  );

  const saveView = useCallback(
    (view: SavedView) => {
      persist([...views, view]);
    },
    [views, persist],
  );

  const deleteView = useCallback(
    (viewId: string) => {
      persist(views.filter((v) => v.id !== viewId));
    },
    [views, persist],
  );

  const updateView = useCallback(
    (viewId: string, update: Partial<SavedView>) => {
      persist(views.map((v) => (v.id === viewId ? { ...v, ...update } : v)));
    },
    [views, persist],
  );

  return {
    views,
    saveView,
    deleteView,
    updateView,
  };
}
