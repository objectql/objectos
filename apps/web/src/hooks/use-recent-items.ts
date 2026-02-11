/**
 * Recent items and favorites tracking hook.
 *
 * Stores recently visited records in localStorage for quick navigation.
 * Items are tracked per-app and ordered by most recent access.
 *
 * Task H.2.4
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface RecentItem {
  id: string;
  appId: string;
  objectName: string;
  recordId?: string;
  title: string;
  href: string;
  visitedAt: string;
}

const STORAGE_KEY = 'objectos:recent-items';
const MAX_ITEMS = 20;

function loadItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadItems);
  const { pathname } = useLocation();

  // Track route changes
  useEffect(() => {
    const match = pathname.match(/^\/apps\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!match) return;

    const [, appId, objectName, recordId] = match;
    if (recordId === 'new') return;

    const item: RecentItem = {
      id: `${appId}:${objectName}:${recordId}`,
      appId,
      objectName,
      recordId,
      title: `${objectName} / ${recordId}`,
      href: pathname,
      visitedAt: new Date().toISOString(),
    };

    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_ITEMS);
      saveItems(updated);
      return updated;
    });
  }, [pathname]);

  const addItem = useCallback((item: Omit<RecentItem, 'visitedAt'>) => {
    const full: RecentItem = { ...item, visitedAt: new Date().toISOString() };
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.id !== full.id);
      const updated = [full, ...filtered].slice(0, MAX_ITEMS);
      saveItems(updated);
      return updated;
    });
  }, []);

  const clearItems = useCallback(() => {
    setRecentItems([]);
    saveItems([]);
  }, []);

  return { recentItems, addItem, clearItems };
}
