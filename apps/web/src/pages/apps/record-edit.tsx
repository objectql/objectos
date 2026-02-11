/**
 * Record Edit Page — edit an existing record using SchemaRenderer form view.
 *
 * Uses @object-ui SchemaRenderer in form mode with recordId for
 * metadata-driven record editing.
 *
 * Route: /apps/:appId/:objectName/:recordId/edit
 *
 * Task H.1.4
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecord, useUpdateRecord } from '@/hooks/use-records';
import { MetadataForm } from '@/components/objectui/MetadataForm';
import { Button } from '@/components/ui/button';
import type { RecordData } from '@/types/metadata';

export default function RecordEditPage() {
  const { appId, objectName, recordId } = useParams();
  const navigate = useNavigate();

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: record, isLoading: dataLoading } = useRecord({ objectName, recordId });
  const updateMutation = useUpdateRecord({
    objectName: objectName!,
    recordId: recordId!,
  });

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
          The requested record does not exist or you do not have permission to edit it.
        </p>
      </div>
    );
  }

  const primaryField = objectDef.primaryField ?? 'name';
  const recordTitle = String(record[primaryField] ?? record.id ?? 'Untitled');

  const handleSubmit = (data: RecordData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        navigate(`/apps/${appId}/${objectName}/${recordId}`);
      },
    });
  };

  const handleCancel = () => {
    navigate(`/apps/${appId}/${objectName}/${recordId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link to={`/apps/${appId}/${objectName}/${recordId}`}>
            <ArrowLeft className="mr-2 size-4" />
            {recordTitle}
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          Edit {recordTitle}
        </h2>
        <p className="text-muted-foreground">
          Update this {((objectDef?.label ?? objectName) || 'record').toLowerCase()} record.
        </p>
      </div>

      {/* SchemaRenderer form view with recordId — H.1.4 */}
      <div data-testid="schema-renderer-edit">
        <SchemaRenderer
          adapter={objectUIAdapter}
          objectName={objectName!}
          view="form"
          recordId={recordId}
          onSave={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* Fallback form using local MetadataForm */}
      <MetadataForm
        objectDef={objectDef}
        record={record}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
