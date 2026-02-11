/**
 * useInlineEdit — manage inline editing state for grid cells.
 *
 * Provides mutation logic for updating individual field values
 * on records directly from the grid view.
 *
 * Phase I — Task I.1
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { objectStackClient } from '@/lib/api';

interface UseInlineEditOptions {
  objectName: string;
}

export function useInlineEdit({ objectName }: UseInlineEditOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      recordId,
      field,
      value,
    }: {
      recordId: string;
      field: string;
      value: unknown;
    }) => {
      const result = await objectStackClient.data.update(objectName, recordId, {
        [field]: value,
      });
      return result;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
      void queryClient.invalidateQueries({
        queryKey: ['record', objectName, variables.recordId],
      });
    },
  });

  const updateField = useCallback(
    (recordId: string, field: string, value: unknown) => {
      mutation.mutate({ recordId, field, value });
    },
    [mutation],
  );

  return {
    updateField,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
