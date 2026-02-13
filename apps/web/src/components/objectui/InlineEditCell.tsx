/**
 * InlineEditCell — click-to-edit cell component for grid views.
 *
 * Renders a field value that can be clicked to enter edit mode.
 * Uses @object-ui/fields-compatible input types based on field definitions.
 *
 * Phase I — Task I.1
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import type { FieldDefinition } from '@/types/metadata';

interface InlineEditCellProps {
  field: FieldDefinition;
  value: unknown;
  onSave: (value: unknown) => void;
  /** Whether inline editing is enabled */
  editable?: boolean;
}

export function InlineEditCell({ field, value, onSave, editable = true }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!editable || field.readonly) return;
    setEditValue(value != null ? String(value) : '');
    setIsEditing(true);
  }, [editable, field.readonly, value]);

  const handleSave = useCallback(() => {
    let parsed: unknown = editValue;
    if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
      parsed = editValue === '' ? null : Number(editValue);
    } else if (field.type === 'boolean' || field.type === 'toggle') {
      parsed = editValue === 'true';
    }
    onSave(parsed);
    setIsEditing(false);
  }, [editValue, field.type, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  if (!isEditing) {
    return (
      <div
        className={
          editable && !field.readonly ? 'cursor-pointer rounded px-1 hover:bg-muted/50' : ''
        }
        onClick={startEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') startEditing();
        }}
        role={editable && !field.readonly ? 'button' : undefined}
        tabIndex={editable && !field.readonly ? 0 : undefined}
        data-testid="inline-edit-cell"
      >
        <FieldRenderer field={field} value={value} />
      </div>
    );
  }

  // Render appropriate input based on field type
  if (field.type === 'select' || field.type === 'radio') {
    return (
      <div className="flex items-center gap-1" data-testid="inline-edit-active">
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-full rounded border border-input bg-background px-2 text-sm"
          aria-label={`Edit ${field.label ?? field.name}`}
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleSave}
          aria-label="Save"
        >
          <Check className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleCancel}
          aria-label="Cancel"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  const inputType =
    field.type === 'number' || field.type === 'currency' || field.type === 'percent'
      ? 'number'
      : field.type === 'email'
        ? 'email'
        : field.type === 'date'
          ? 'date'
          : field.type === 'datetime'
            ? 'datetime-local'
            : 'text';

  return (
    <div className="flex items-center gap-1" data-testid="inline-edit-active">
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={inputType}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm"
        aria-label={`Edit ${field.label ?? field.name}`}
      />
      <Button variant="ghost" size="icon" className="size-6" onClick={handleSave} aria-label="Save">
        <Check className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={handleCancel}
        aria-label="Cancel"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
