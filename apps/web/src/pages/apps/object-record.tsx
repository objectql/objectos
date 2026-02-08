/**
 * Object Record Page — displays a single record's fields.
 *
 * Route: /apps/:appId/:objectName/:recordId
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecord } from '@/hooks/use-records';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function ObjectRecordPage() {
  const { appId, objectName, recordId } = useParams();

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: record, isLoading: dataLoading } = useRecord({ objectName, recordId });

  const isLoading = metaLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!objectDef || !record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/apps/${appId}/${objectName}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Record not found</h2>
        <p className="text-muted-foreground">
          The requested record does not exist.
        </p>
      </div>
    );
  }

  // Determine the record title from the primary field
  const primaryField = objectDef.primaryField ?? 'name';
  const recordTitle = String(record[primaryField] ?? record.id ?? 'Untitled');

  // Group fields: primary info fields vs metadata/readonly fields
  const allFields = Object.values(objectDef.fields).filter((f) => f.name !== 'id');
  const editableFields = allFields.filter((f) => !f.readonly);
  const readonlyFields = allFields.filter((f) => f.readonly);

  return (
    <div className="space-y-6">
      {/* Back link + title */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link to={`/apps/${appId}/${objectName}`}>
            <ArrowLeft className="mr-2 size-4" />
            {objectDef.pluralLabel}
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{recordTitle}</h2>
        <p className="text-muted-foreground">{objectDef.label} Detail</p>
      </div>

      {/* Field card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {editableFields.map((field) => (
              <div key={field.name}>
                <dt className="text-sm font-medium text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm">
                  <FieldRenderer field={field} value={record[field.name]} />
                </dd>
              </div>
            ))}
          </dl>

          {readonlyFields.length > 0 && (
            <>
              <Separator className="my-6" />
              <dl className="grid gap-4 sm:grid-cols-2">
                {readonlyFields.map((field) => (
                  <div key={field.name}>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="mt-1 text-sm">
                      <FieldRenderer field={field} value={record[field.name]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
