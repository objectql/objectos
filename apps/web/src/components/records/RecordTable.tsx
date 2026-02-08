/**
 * RecordTable — renders a list of records as a data table.
 *
 * Columns are derived from the object's `listFields` (or all non-readonly
 * fields as a fallback).  Each row links to the record detail page.
 */

import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FieldRenderer } from './FieldRenderer';
import type { ObjectDefinition, RecordData, ResolvedField } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface RecordTableProps {
  objectDef: ObjectDefinition;
  records: RecordData[];
  basePath: string;
}

export function RecordTable({ objectDef, records, basePath }: RecordTableProps) {
  const allResolved = resolveFields(objectDef.fields, ['id']);

  let columns: ResolvedField[];
  if (objectDef.listFields) {
    // Use specified list fields in order
    const fieldMap = new Map(allResolved.map((f) => [f.name, f]));
    columns = objectDef.listFields
      .map((name) => fieldMap.get(name))
      .filter((f): f is ResolvedField => !!f);
  } else {
    // Fallback: all non-readonly fields
    columns = allResolved.filter((f) => !f.readonly);
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-lg font-medium">No {(objectDef.pluralLabel ?? objectDef.label ?? 'records').toLowerCase()} yet</p>
        <p className="text-sm text-muted-foreground">
          Records will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.name}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const id = String(record.id ?? '');
            return (
              <TableRow key={id} className="cursor-pointer hover:bg-muted/50">
                {columns.map((col, idx) => (
                  <TableCell key={col.name}>
                    {idx === 0 ? (
                      <Link
                        to={`${basePath}/${id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <FieldRenderer field={col} value={record[col.name]} />
                      </Link>
                    ) : (
                      <FieldRenderer field={col} value={record[col.name]} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
