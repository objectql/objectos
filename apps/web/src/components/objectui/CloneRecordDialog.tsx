/**
 * CloneRecordDialog — duplicate a record with optional field selection.
 *
 * Shows a dialog allowing the user to clone a record, optionally
 * deselecting fields they don't want to copy.
 *
 * Phase I — Task I.5
 */

import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ObjectDefinition, RecordData } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface CloneRecordDialogProps {
  objectDef: ObjectDefinition;
  record: RecordData;
  onClone: (data: Partial<RecordData>) => void;
  isLoading?: boolean;
}

export function CloneRecordDialog({
  objectDef,
  record,
  onClone,
  isLoading = false,
}: CloneRecordDialogProps) {
  const [open, setOpen] = useState(false);

  const cloneableFields = useMemo(() => {
    return resolveFields(objectDef.fields, ['id', 'created_at', 'updated_at']);
  }, [objectDef.fields]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    () => new Set(cloneableFields.filter((f) => !f.readonly).map((f) => f.name)),
  );

  const toggleField = (name: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleClone = () => {
    const clonedData: Partial<RecordData> = {};
    for (const field of cloneableFields) {
      if (selectedFields.has(field.name) && record[field.name] !== undefined) {
        clonedData[field.name] = record[field.name];
      }
    }
    onClone(clonedData);
    setOpen(false);
  };

  // Reset selection when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedFields(new Set(cloneableFields.filter((f) => !f.readonly).map((f) => f.name)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="size-4" />
          Clone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone {objectDef.label ?? objectDef.name}</DialogTitle>
          <DialogDescription>Select which fields to copy to the new record.</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-2" data-testid="clone-field-list">
            {cloneableFields.map((field) => {
              const isReadonly = !!field.readonly;
              const value = record[field.name];
              const displayValue = value != null ? String(value) : '—';

              return (
                <label
                  key={field.name}
                  className={`flex items-center gap-3 rounded-md border p-2 text-sm ${
                    isReadonly
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.name)}
                    onChange={() => toggleField(field.name)}
                    disabled={isReadonly}
                    className="size-4 rounded"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{field.label}</span>
                    <span className="ml-2 text-muted-foreground">{displayValue}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={isLoading || selectedFields.size === 0}>
            {isLoading ? 'Cloning...' : `Clone (${selectedFields.size} fields)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
