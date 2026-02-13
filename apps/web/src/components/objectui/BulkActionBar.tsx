/**
 * BulkActionBar — action bar for bulk record operations.
 *
 * Shows a contextual action bar when records are selected, supporting:
 * - Bulk delete
 * - Bulk field update
 * - Change owner
 * - Deselect all
 *
 * Phase I — Task I.2
 */

import { useState } from 'react';
import { Trash2, Edit, UserRound, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ObjectDefinition } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface BulkActionBarProps {
  objectDef: ObjectDefinition;
  selectedIds: string[];
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], field: string, value: unknown) => void;
  onDeselectAll: () => void;
}

export function BulkActionBar({
  objectDef,
  selectedIds,
  onBulkDelete,
  onBulkUpdate,
  onDeselectAll,
}: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateField, setUpdateField] = useState('');
  const [updateValue, setUpdateValue] = useState('');

  const editableFields = resolveFields(objectDef.fields, ['id']).filter((f) => !f.readonly);

  const handleDelete = () => {
    onBulkDelete(selectedIds);
    setShowDeleteConfirm(false);
  };

  const handleUpdate = () => {
    if (updateField && onBulkUpdate) {
      onBulkUpdate(selectedIds, updateField, updateValue);
    }
    setShowUpdateDialog(false);
    setUpdateField('');
    setUpdateValue('');
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2"
        data-testid="bulk-action-bar"
      >
        <span className="text-sm font-medium">
          {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-1.5 border-l pl-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          {onBulkUpdate && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowUpdateDialog(true)}
            >
              <Edit className="size-4" />
              Update field
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (onBulkUpdate) {
                setUpdateField('');
                setUpdateValue('');
                setShowUpdateDialog(true);
              }
            }}
          >
            <UserRound className="size-4" />
            Change owner
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={onDeselectAll}>
          <XCircle className="size-4" />
          Deselect
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''}?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected{' '}
              {(objectDef.pluralLabel ?? objectDef.label ?? 'records').toLowerCase()} will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk update dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update field for {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Choose a field and value to apply to all selected records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Field</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={updateField}
                onChange={(e) => setUpdateField(e.target.value)}
                aria-label="Select field to update"
              >
                <option value="">Select field...</option>
                {editableFields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">New value</label>
              {(() => {
                const selectedFieldDef = editableFields.find((f) => f.name === updateField);
                if (selectedFieldDef?.options) {
                  return (
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      aria-label="New value"
                    >
                      <option value="">Select value...</option>
                      {selectedFieldDef.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  );
                }
                return (
                  <Input
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder="Enter new value..."
                    aria-label="New value"
                  />
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!updateField}>
              Update {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
