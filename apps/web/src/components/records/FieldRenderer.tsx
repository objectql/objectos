/**
 * Renders a single field value based on its type definition.
 *
 * Used in both table cells (list view) and field rows (detail view)
 * to provide consistent, type-aware formatting across the app.
 */

import { Badge } from '@/components/ui/badge';
import type { FieldDefinition } from '@/types/metadata';

interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
}

export function FieldRenderer({ field, value }: FieldRendererProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.type) {
    case 'boolean':
    case 'toggle':
      return <span>{value ? 'Yes' : 'No'}</span>;

    case 'date':
    case 'datetime': {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return <span>{String(value)}</span>;
      return (
        <span title={date.toISOString()}>
          {date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      );
    }

    case 'currency':
      return (
        <span>
          {new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
          }).format(Number(value))}
        </span>
      );

    case 'percent':
      return <span>{Number(value).toFixed(1)}%</span>;

    case 'number':
      return <span>{new Intl.NumberFormat().format(Number(value))}</span>;

    case 'select':
    case 'radio': {
      const option = field.options?.find((o) => o.value === value);
      return (
        <Badge variant="outline" className="font-normal">
          {option?.label ?? String(value)}
        </Badge>
      );
    }

    case 'multiselect':
    case 'checkboxes':
    case 'tags': {
      const values = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => {
            const opt = field.options?.find((o) => o.value === v);
            return (
              <Badge key={String(v)} variant="outline" className="font-normal">
                {opt?.label ?? String(v)}
              </Badge>
            );
          })}
        </div>
      );
    }

    case 'email':
      return (
        <a
          href={`mailto:${String(value)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {String(value)}
        </a>
      );

    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          {String(value)}
        </a>
      );

    case 'phone':
      return (
        <a
          href={`tel:${String(value)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {String(value)}
        </a>
      );

    case 'lookup':
    case 'master_detail':
      return <span className="text-muted-foreground">{String(value)}</span>;

    case 'textarea':
    case 'markdown':
    case 'richtext':
    case 'html':
      return (
        <span className="line-clamp-2" title={String(value)}>
          {String(value)}
        </span>
      );

    default:
      return <span>{String(value)}</span>;
  }
}
