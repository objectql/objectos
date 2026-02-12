/**
 * useVirtualScroll — virtual scroll hook for large lists.
 *
 * Calculates visible items based on scroll position, container height,
 * and item height. Used by DataGrid and other large-list components.
 *
 * Phase L — Task L.1
 */

import { useState, useCallback, useMemo, useRef } from 'react';

interface UseVirtualScrollOptions {
  /** Total number of items */
  totalItems: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the visible container in pixels */
  containerHeight: number;
  /** Number of items to render outside the visible area */
  overscan?: number;
}

interface VirtualScrollResult {
  /** The items currently visible (indices) */
  visibleRange: { start: number; end: number };
  /** Total height of all items for the scroll container */
  totalHeight: number;
  /** Offset for the first visible item */
  offsetTop: number;
  /** Number of visible items */
  visibleCount: number;
  /** Handle scroll event */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Ref for the scroll container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Scroll to a specific item index */
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll({
  totalItems,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = totalItems * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(totalItems, start + visibleCount + overscan * 2);
    return { start, end };
  }, [scrollTop, itemHeight, overscan, totalItems, visibleCount]);

  const offsetTop = visibleRange.start * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = index * itemHeight;
      }
    },
    [itemHeight],
  );

  return {
    visibleRange,
    totalHeight,
    offsetTop,
    visibleCount,
    onScroll,
    containerRef,
    scrollToIndex,
  };
}
