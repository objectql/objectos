/**
 * Record Create Page — create a new record using SchemaRenderer form view.
 *
 * Uses @object-ui SchemaRenderer in form mode for metadata-driven record creation.
 *
 * Route: /apps/:appId/:objectName/new
 *
 * Task H.1.3
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useCreateRecord } from '@/hooks/use-records';
import { Button } from '@/components/ui/button';
import type { RecordData } from '@/types/metadata';

export default function RecordCreatePage() {
  const { appId, objectName } = useParams();
  const navigate = useNavigate();

  const { data: objectDef, isLoading } = useObjectDefinition(objectName);
  const createMutation = useCreateRecord({ objectName: objectName! });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!objectDef) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/apps/${appId}/${objectName}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Object not found</h2>
        <p className="text-muted-foreground">Cannot create a record for an undefined object.</p>
      </div>
    );
  }

  const handleSubmit = (data: RecordData) => {
    createMutation.mutate(data, {
      onSuccess: (record) => {
        const recordId = record?.id ?? '';
        if (recordId) {
          navigate(`/apps/${appId}/${objectName}/${recordId}`);
        } else {
          navigate(`/apps/${appId}/${objectName}`);
        }
      },
    });
  };

  const handleCancel = () => {
    navigate(`/apps/${appId}/${objectName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link to={`/apps/${appId}/${objectName}`}>
            <ArrowLeft className="mr-2 size-4" />
            {objectDef.pluralLabel ?? objectDef.label ?? objectName}
          </Link>
        </Button>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">New {objectDef.label ?? objectName}</h2>
        <p className="text-muted-foreground">
          Create a new {((objectDef?.label ?? objectName) || 'record').toLowerCase()} record.
        </p>
      </div>

      {/* SchemaRenderer form view — H.1.3 */}
      <div data-testid="schema-renderer-form">
        <SchemaRenderer
          adapter={objectUIAdapter}
          objectName={objectName!}
          view="form"
          onSave={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
