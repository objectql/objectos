/**
 * KanbanBoard — kanban board view for pipeline objects.
 *
 * Displays records grouped by a select/status field as draggable cards
 * across columns. Used for opportunity pipelines, task boards, etc.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import type { ObjectDefinition, RecordData } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';
import type { KanbanColumn } from '@/types/workflow';

interface KanbanBoardProps {
  objectDef: ObjectDefinition;
  records: RecordData[];
  basePath: string;
  /** Field name used to group records into columns */
  groupField: string;
  /** Optional custom column definitions. If omitted, derived from field options. */
  columns?: KanbanColumn[];
}

export function KanbanBoard({
  objectDef,
  records,
  basePath,
  groupField,
  columns: customColumns,
}: KanbanBoardProps) {
  const allResolved = resolveFields(objectDef.fields, ['id']);
  const groupFieldDef = allResolved.find((f) => f.name === groupField);

  // Derive columns from field options or custom config
  const columns: KanbanColumn[] = useMemo(() => {
    if (customColumns) return customColumns;
    if (groupFieldDef?.options) {
      return groupFieldDef.options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        color: opt.color,
      }));
    }
    // Fallback: unique values from records
    const values = new Set(records.map((r) => String(r[groupField] ?? '')).filter(Boolean));
    return Array.from(values).map((v) => ({ value: v, label: v }));
  }, [customColumns, groupFieldDef, records, groupField]);

  // Group records by column
  const groupedRecords = useMemo(() => {
    const groups: Record<string, RecordData[]> = {};
    for (const col of columns) {
      groups[col.value] = [];
    }
    for (const record of records) {
      const val = String(record[groupField] ?? '');
      if (groups[val]) {
        groups[val].push(record);
      }
    }
    return groups;
  }, [records, columns, groupField]);

  // Display fields (exclude group field and id)
  const displayFields = allResolved
    .filter((f) => f.name !== groupField && f.name !== 'id' && !f.readonly)
    .slice(0, 3);

  const primaryField = objectDef.primaryField ?? 'name';

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
      {columns.map((col) => {
        const columnRecords = groupedRecords[col.value] ?? [];
        return (
          <div
            key={col.value}
            className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30"
            data-testid={`kanban-column-${col.value}`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnRecords.length}
                </Badge>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 p-2">
              {columnRecords.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No items
                </div>
              )}
              {columnRecords.map((record) => {
                const id = String(record.id ?? '');
                const title = String(record[primaryField] ?? 'Untitled');
                return (
                  <Link key={id} to={`${basePath}/${id}`} className="block">
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1">
                        <div className="space-y-1">
                          {displayFields.map((field) => (
                            <div key={field.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="shrink-0">{field.label}:</span>
                              <span className="truncate">
                                <FieldRenderer field={field} value={record[field.name]} />
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
