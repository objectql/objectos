/**
 * DataGrid — advanced data grid with virtual scrolling.
 *
 * Renders large record sets efficiently using virtualized rows.
 * Supports column sorting, resizing indicators, and selection.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import type { ObjectDefinition, RecordData, ResolvedField } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface DataGridProps {
  objectDef: ObjectDefinition;
  records: RecordData[];
  basePath: string;
  /** Height of the grid container in pixels */
  height?: number;
  /** Height of each row in pixels */
  rowHeight?: number;
  /** Whether to show row selection checkboxes */
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 44;
const OVERSCAN = 5;

export function DataGrid({
  objectDef,
  records,
  basePath,
  height = 500,
  rowHeight = ROW_HEIGHT,
  selectable = false,
  onSelectionChange,
}: DataGridProps) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const allResolved = resolveFields(objectDef.fields, ['id']);
  let columns: ResolvedField[];
  if (objectDef.listFields) {
    const fieldMap = new Map(allResolved.map((f) => [f.name, f]));
    columns = objectDef.listFields
      .map((name) => fieldMap.get(name))
      .filter((f): f is ResolvedField => !!f);
  } else {
    columns = allResolved.filter((f) => !f.readonly);
  }

  // Sort records
  const sortedRecords = useMemo(() => {
    if (!sort) return records;
    const sorted = [...records].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [records, sort]);

  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev?.column === column) {
        return prev.direction === 'asc' ? { column, direction: 'desc' } : null;
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const handleToggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === sortedRecords.length) {
        onSelectionChange?.([]);
        return new Set();
      }
      const allIds = sortedRecords.map((r) => String(r.id ?? ''));
      onSelectionChange?.(allIds);
      return new Set(allIds);
    });
  }, [sortedRecords, onSelectionChange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Virtual scrolling calculations
  const totalHeight = sortedRecords.length * rowHeight;
  const visibleCount = Math.ceil((height - HEADER_HEIGHT) / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(sortedRecords.length, startIndex + visibleCount + OVERSCAN * 2);
  const visibleRecords = sortedRecords.slice(startIndex, endIndex);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-lg font-medium">
          No {(objectDef.pluralLabel ?? objectDef.label ?? 'records').toLowerCase()} yet
        </p>
        <p className="text-sm text-muted-foreground">
          Records will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border" data-testid="data-grid">
      <div ref={containerRef} className="overflow-auto" style={{ height }} onScroll={handleScroll}>
        <div style={{ minWidth: `${columns.length * 150}px` }}>
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex border-b bg-muted/50"
            style={{ height: HEADER_HEIGHT }}
          >
            {selectable && (
              <div className="flex w-10 shrink-0 items-center justify-center border-r">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sortedRecords.length && sortedRecords.length > 0}
                  onChange={handleSelectAll}
                  className="size-4 rounded"
                  aria-label="Select all rows"
                />
              </div>
            )}
            {columns.map((col) => (
              <div
                key={col.name}
                className="flex flex-1 cursor-pointer items-center gap-1 px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                style={{ minWidth: 120 }}
                onClick={() => handleSort(col.name)}
                role="columnheader"
                aria-sort={
                  sort?.column === col.name
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <span>{col.label}</span>
                {sort?.column === col.name &&
                  (sort.direction === 'asc' ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  ))}
              </div>
            ))}
          </div>

          {/* Virtual rows */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleRecords.map((record, idx) => {
              const id = String(record.id ?? '');
              const top = (startIndex + idx) * rowHeight;
              return (
                <div
                  key={id}
                  className="absolute flex w-full border-b hover:bg-muted/50"
                  style={{ height: rowHeight, top }}
                >
                  {selectable && (
                    <div className="flex w-10 shrink-0 items-center justify-center border-r">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => handleToggleSelect(id)}
                        className="size-4 rounded"
                        aria-label={`Select row ${id}`}
                      />
                    </div>
                  )}
                  {columns.map((col, colIdx) => (
                    <div
                      key={col.name}
                      className="flex flex-1 items-center px-3 text-sm"
                      style={{ minWidth: 120 }}
                    >
                      {colIdx === 0 ? (
                        <Link
                          to={`${basePath}/${id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          <FieldRenderer field={col} value={record[col.name]} />
                        </Link>
                      ) : (
                        <FieldRenderer field={col} value={record[col.name]} />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
