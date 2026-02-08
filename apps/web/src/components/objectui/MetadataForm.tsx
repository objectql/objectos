/**
 * MetadataForm — metadata-driven form control.
 *
 * Automatically generates form fields from an ObjectDefinition,
 * rendering the correct input type for each field based on its FieldType.
 * Supports create and edit modes.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ObjectDefinition, RecordData, ResolvedField } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface MetadataFormProps {
  objectDef: ObjectDefinition;
  /** Existing record data for edit mode. If omitted, renders in create mode. */
  record?: RecordData;
  onSubmit: (data: RecordData) => void;
  onCancel?: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ResolvedField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}) {
  const strValue = value != null ? String(value) : '';

  switch (field.type) {
    case 'boolean':
    case 'toggle':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          className="size-4 rounded border-input"
          aria-label={field.label}
        />
      );

    case 'number':
    case 'currency':
    case 'percent':
      return (
        <Input
          type="number"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : '')}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={strValue.split('T')[0] ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={strValue.replace('Z', '').slice(0, 16)}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'email':
      return (
        <Input
          type="email"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'phone':
      return (
        <Input
          type="tel"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'textarea':
    case 'markdown':
    case 'richtext':
      return (
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );

    case 'select':
    case 'radio':
      return (
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    default:
      return (
        <Input
          type="text"
          value={strValue}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-label={field.label}
        />
      );
  }
}

export function MetadataForm({
  objectDef,
  record,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MetadataFormProps) {
  const editableFields = resolveFields(objectDef.fields, ['id']).filter((f) => !f.readonly);

  const [formData, setFormData] = useState<RecordData>(() => {
    const initial: RecordData = {};
    for (const field of editableFields) {
      initial[field.name] = record?.[field.name] ?? field.defaultValue ?? '';
    }
    return initial;
  });

  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    },
    [formData, onSubmit],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {record ? 'Edit' : 'New'} {objectDef.label ?? objectDef.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {editableFields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <div className="mt-1.5">
                  <FieldInput
                    field={field}
                    value={formData[field.name]}
                    onChange={handleChange}
                  />
                </div>
                {field.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : record ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
