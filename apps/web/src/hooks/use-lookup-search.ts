/**
 * useLookupSearch — async search for lookup field records.
 *
 * Provides debounced search functionality for looking up records
 * in referenced objects, used by LookupAutocomplete.
 *
 * Phase I — Task I.7
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRecords } from '@/hooks/use-records';
import { useObjectDefinition } from '@/hooks/use-metadata';
import type { RecordData } from '@/types/metadata';

interface UseLookupSearchOptions {
  /** The referenced object name */
  referencedObject: string;
  /** Debounce delay in ms */
  debounceMs?: number;
}

export function useLookupSearch({
  referencedObject,
  debounceMs = 300,
}: UseLookupSearchOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: objectDef } = useObjectDefinition(referencedObject);
  const primaryField = objectDef?.primaryField ?? 'name';

  // Debounce search term
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchTerm, debounceMs]);

  const { data: result, isLoading } = useRecords({
    objectName: referencedObject,
    pageSize: 10,
    filters: debouncedTerm
      ? [{ field: primaryField, operator: 'contains', value: debouncedTerm }]
      : undefined,
  });

  const search = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clear = useCallback(() => {
    setSearchTerm('');
    setDebouncedTerm('');
  }, []);

  return {
    search,
    clear,
    searchTerm,
    results: (result?.records ?? []) as RecordData[],
    isLoading,
    primaryField,
  };
}
