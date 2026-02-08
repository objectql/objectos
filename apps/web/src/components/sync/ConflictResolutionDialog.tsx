/**
 * ConflictResolutionDialog — manual conflict resolution UI.
 *
 * Displays a side-by-side comparison of local vs server data
 * and lets the user choose which version to keep (or merge manually).
 */

import { useState } from 'react';
import type { SyncConflict } from '@/lib/sync-engine';

interface ConflictResolutionDialogProps {
  conflict: SyncConflict;
  onResolve: (
    conflictId: string,
    resolution: 'local' | 'server' | 'manual',
    manualData?: Record<string, unknown>,
  ) => void;
  onCancel: () => void;
}

export function ConflictResolutionDialog({
  conflict,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server'>('server');

  const allKeys = Array.from(
    new Set([...Object.keys(conflict.localData), ...Object.keys(conflict.serverData)]),
  ).filter((k) => k !== 'id');

  const diffKeys = allKeys.filter(
    (k) => JSON.stringify(conflict.localData[k]) !== JSON.stringify(conflict.serverData[k]),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Resolve sync conflict"
      data-testid="conflict-resolution-dialog"
    >
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Sync Conflict</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The record <strong>{conflict.recordId}</strong> on{' '}
          <strong>{conflict.objectName}</strong> was modified both locally and on the server.
        </p>

        {/* Diff table */}
        <div className="mt-4 max-h-64 overflow-auto rounded border">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium" scope="col">Field</th>
                <th className="px-3 py-2 text-left font-medium" scope="col">Local</th>
                <th className="px-3 py-2 text-left font-medium" scope="col">Server</th>
              </tr>
            </thead>
            <tbody>
              {diffKeys.map((key) => (
                <tr key={key} className="border-b">
                  <td className="px-3 py-2 font-mono text-xs">{key}</td>
                  <td className="px-3 py-2 bg-destructive/5">{formatValue(conflict.localData[key])}</td>
                  <td className="px-3 py-2 bg-primary/5">{formatValue(conflict.serverData[key])}</td>
                </tr>
              ))}
              {diffKeys.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    No field differences detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resolution options */}
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Choose resolution:</legend>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="resolution"
                value="local"
                checked={selectedResolution === 'local'}
                onChange={() => setSelectedResolution('local')}
              />
              Keep local version
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="resolution"
                value="server"
                checked={selectedResolution === 'server'}
                onChange={() => setSelectedResolution('server')}
              />
              Keep server version
            </label>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => onResolve(conflict.id, selectedResolution)}
            data-testid="resolve-conflict-btn"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
