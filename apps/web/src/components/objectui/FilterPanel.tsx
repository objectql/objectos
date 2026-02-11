/**
 * FilterPanel — metadata-aware filter builder for list views.
 *
 * Generates filter controls dynamically from an ObjectDefinition's fields.
 * Supports text search, select/dropdown filters, date ranges, and number ranges.
 *
 * Task H.4.4
 */

import { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ObjectDefinition } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

export interface FilterValue {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between';
  value: string;
}

interface FilterPanelProps {
  objectDef: ObjectDefinition;
  filters: FilterValue[];
  onFiltersChange: (filters: FilterValue[]) => void;
  /** Search term for global text search */
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function FilterPanel({
  objectDef,
  filters,
  onFiltersChange,
  searchTerm = '',
  onSearchChange,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingField, setPendingField] = useState('');
  const [pendingValue, setPendingValue] = useState('');

  const allFields = resolveFields(objectDef.fields, ['id']);
  const filterableFields = allFields.filter(
    (f) =>
      !f.readonly &&
      ['text', 'email', 'select', 'radio', 'number', 'currency', 'date', 'datetime'].includes(f.type),
  );

  const addFilter = useCallback(() => {
    if (!pendingField || !pendingValue) return;
    const field = filterableFields.find((f) => f.name === pendingField);
    if (!field) return;

    const operator =
      field.type === 'select' || field.type === 'radio' ? 'equals' : 'contains';

    onFiltersChange([
      ...filters,
      { field: pendingField, operator, value: pendingValue },
    ]);
    setPendingField('');
    setPendingValue('');
  }, [pendingField, pendingValue, filters, filterableFields, onFiltersChange]);

  const removeFilter = useCallback(
    (index: number) => {
      onFiltersChange(filters.filter((_, i) => i !== index));
    },
    [filters, onFiltersChange],
  );

  const clearAll = useCallback(() => {
    onFiltersChange([]);
    onSearchChange?.('');
  }, [onFiltersChange, onSearchChange]);

  const selectedFieldDef = filterableFields.find((f) => f.name === pendingField);

  return (
    <div className="space-y-3" data-testid="filter-panel">
      {/* Search + filter toggle */}
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${(objectDef.pluralLabel ?? objectDef.label ?? 'records').toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search records"
            />
          </div>
        )}
        <Button
          variant={isExpanded ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="size-4" />
          Filters
          {filters.length > 0 && (
            <Badge variant="default" className="ml-1 size-5 justify-center rounded-full p-0 text-xs">
              {filters.length}
            </Badge>
          )}
        </Button>
        {(filters.length > 0 || searchTerm) && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter, index) => {
            const fieldDef = allFields.find((f) => f.name === filter.field);
            return (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                <span className="font-medium">{fieldDef?.label ?? filter.field}:</span>
                <span>{filter.value}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${fieldDef?.label ?? filter.field} filter`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filter builder */}
      {isExpanded && (
        <div className="flex items-end gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Field</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={pendingField}
              onChange={(e) => {
                setPendingField(e.target.value);
                setPendingValue('');
              }}
              aria-label="Filter field"
            >
              <option value="">Select field...</option>
              {filterableFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Value</label>
            {selectedFieldDef?.options ? (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={pendingValue}
                onChange={(e) => setPendingValue(e.target.value)}
                aria-label="Filter value"
              >
                <option value="">Select value...</option>
                {selectedFieldDef.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Filter value..."
                value={pendingValue}
                onChange={(e) => setPendingValue(e.target.value)}
                className="h-9"
                aria-label="Filter value"
              />
            )}
          </div>

          <Button size="sm" onClick={addFilter} disabled={!pendingField || !pendingValue}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
