/**
 * useCsvOperations — CSV import and export operations.
 *
 * Provides mutation logic for bulk importing records from CSV data
 * and helper functions for CSV export.
 *
 * Phase I — Task I.6
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { objectStackClient } from '@/lib/api';

interface UseCsvOperationsOptions {
  objectName: string;
}

export function useCsvOperations({ objectName }: UseCsvOperationsOptions) {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (records: Record<string, unknown>[]) => {
      const results = [];
      for (const record of records) {
        const result = await objectStackClient.data.create(objectName, record);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
    },
  });

  const importRecords = useCallback(
    (records: Record<string, unknown>[]) => {
      importMutation.mutate(records);
    },
    [importMutation],
  );

  return {
    importRecords,
    isImporting: importMutation.isPending,
    importError: importMutation.error,
    importedCount: importMutation.data?.length ?? 0,
  };
}
