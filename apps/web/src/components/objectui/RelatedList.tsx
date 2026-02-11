/**
 * RelatedList — displays child/lookup records on detail pages.
 *
 * Shows records from a related object that reference the current record
 * via a lookup or master_detail field. Renders as a compact table.
 *
 * Task H.4.3
 */

import { Link } from 'react-router-dom';
import { useRecords } from '@/hooks/use-records';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { resolveFields } from '@/types/metadata';

interface RelatedListProps {
  /** The related object name (e.g. 'contact') */
  objectName: string;
  /** The foreign key field on the related object (e.g. 'account_id') */
  foreignKeyField: string;
  /** The current record's ID */
  parentRecordId: string;
  /** Base path for building links to related records */
  basePath: string;
  /** Maximum records to display */
  limit?: number;
}

export function RelatedList({
  objectName,
  foreignKeyField,
  parentRecordId,
  basePath,
  limit = 5,
}: RelatedListProps) {
  const { data: objectDef } = useObjectDefinition(objectName);
  const { data: result, isLoading } = useRecords({ objectName, pageSize: limit });

  if (!objectDef) return null;

  // Filter records that match the parent record ID
  const allRecords = result?.records ?? [];
  const filteredRecords = allRecords.filter(
    (r) => String(r[foreignKeyField] ?? '') === parentRecordId,
  );

  const allResolved = resolveFields(objectDef.fields, ['id', foreignKeyField]);
  const columns = objectDef.listFields
    ? objectDef.listFields
        .filter((name) => name !== foreignKeyField)
        .map((name) => allResolved.find((f) => f.name === name))
        .filter((f): f is NonNullable<typeof f> => !!f)
        .slice(0, 4)
    : allResolved.filter((f) => !f.readonly).slice(0, 4);

  return (
    <Card data-testid="related-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {objectDef.pluralLabel ?? objectDef.label ?? objectName}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredRecords.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full size-5 border-2 border-muted border-t-primary" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No related {(objectDef.pluralLabel ?? objectDef.label ?? 'records').toLowerCase()}.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.name} className="text-xs">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const id = String(record.id ?? '');
                  return (
                    <TableRow key={id}>
                      {columns.map((col, idx) => (
                        <TableCell key={col.name} className="text-xs">
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
        )}
      </CardContent>
    </Card>
  );
}
