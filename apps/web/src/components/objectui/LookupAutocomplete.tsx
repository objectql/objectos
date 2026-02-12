/**
 * LookupAutocomplete — async search for related records.
 *
 * Provides an autocomplete input that searches for records in a referenced
 * object using the ObjectStack API, supporting type-ahead filtering.
 *
 * Phase I — Task I.7
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRecords } from '@/hooks/use-records';
import { useObjectDefinition } from '@/hooks/use-metadata';
import type { RecordData } from '@/types/metadata';

interface LookupAutocompleteProps {
  /** The referenced object name (e.g. 'account') */
  referencedObject: string;
  /** Currently selected value (record ID) */
  value?: string;
  /** Label of the currently selected record */
  displayValue?: string;
  /** Callback when a record is selected */
  onSelect: (recordId: string, record: RecordData) => void;
  /** Callback when the selection is cleared */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Field label for accessibility */
  label?: string;
}

export function LookupAutocomplete({
  referencedObject,
  value,
  displayValue,
  onSelect,
  onClear,
  placeholder,
  label,
}: LookupAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: objectDef } = useObjectDefinition(referencedObject);
  const { data: result, isLoading } = useRecords({
    objectName: referencedObject,
    pageSize: 10,
    filters: searchTerm
      ? [{ field: objectDef?.primaryField ?? 'name', operator: 'contains', value: searchTerm }]
      : undefined,
  });

  const records = result?.records ?? [];
  const primaryField = objectDef?.primaryField ?? 'name';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (record: RecordData) => {
      const recordId = String(record.id ?? '');
      onSelect(recordId, record);
      setSearchTerm('');
      setIsOpen(false);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    onClear?.();
    setSearchTerm('');
    setIsOpen(false);
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown' && !isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen],
  );

  // If a value is selected, show it as a chip
  if (value && displayValue) {
    return (
      <div
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5"
        data-testid="lookup-selected"
      >
        <span className="flex-1 text-sm">{displayValue}</span>
        {onClear && (
          <button
            onClick={handleClear}
            className="rounded-full p-0.5 hover:bg-muted"
            aria-label={`Clear ${label ?? 'selection'}`}
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" data-testid="lookup-autocomplete">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? `Search ${objectDef?.label ?? referencedObject}...`}
          className="pl-9"
          aria-label={label ?? `Search ${referencedObject}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md">
          {records.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {isLoading ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
              {records.map((record) => {
                const id = String(record.id ?? '');
                const display = String(record[primaryField] ?? id);
                return (
                  <li
                    key={id}
                    role="option"
                    aria-selected={id === value}
                    className="cursor-pointer px-3 py-1.5 text-sm hover:bg-muted/50"
                    onClick={() => handleSelect(record)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelect(record);
                    }}
                    tabIndex={0}
                  >
                    {display}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
