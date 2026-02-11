/**
 * useDebounce — general-purpose debounce hook.
 *
 * Returns a debounced version of the input value. Useful for
 * search inputs, API calls, and real-time filtering.
 *
 * Phase L — Task L.3
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
