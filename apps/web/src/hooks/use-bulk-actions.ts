/**
 * useBulkActions — manage bulk record operations.
 *
 * Provides selection management and bulk mutation operations
 * (delete, update) for record list views.
 *
 * Phase I — Task I.2
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { objectStackClient } from '@/lib/api';

interface UseBulkActionsOptions {
  objectName: string;
}

export function useBulkActions({ objectName }: UseBulkActionsOptions) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete records sequentially to avoid overwhelming the server
      for (const id of ids) {
        await objectStackClient.data.delete(objectName, id);
      }
    },
    onSuccess: () => {
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      ids,
      field,
      value,
    }: {
      ids: string[];
      field: string;
      value: unknown;
    }) => {
      for (const id of ids) {
        await objectStackClient.data.update(objectName, id, { [field]: value });
      }
    },
    onSuccess: () => {
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: ['records', objectName] });
    },
  });

  const bulkDelete = useCallback(
    (ids: string[]) => {
      bulkDeleteMutation.mutate(ids);
    },
    [bulkDeleteMutation],
  );

  const bulkUpdate = useCallback(
    (ids: string[], field: string, value: unknown) => {
      bulkUpdateMutation.mutate({ ids, field, value });
    },
    [bulkUpdateMutation],
  );

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    bulkDelete,
    bulkUpdate,
    isDeleting: bulkDeleteMutation.isPending,
    isUpdating: bulkUpdateMutation.isPending,
  };
}
