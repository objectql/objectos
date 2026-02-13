/**
 * Object Record Page — displays a single record using SchemaRenderer detail view,
 * workflow status, approval actions, activity timeline, and related lists.
 *
 * Uses @object-ui SchemaRenderer for detail view rendering (Phase H.1.2).
 * Phase I additions: record cloning (I.5), enhanced related lists (I.4).
 *
 * Route: /apps/:appId/:objectName/:recordId
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecord, useCreateRecord } from '@/hooks/use-records';
import { useWorkflowStatus, useActivities } from '@/hooks/use-workflow';
import { objectStackClient } from '@/lib/api';
import { WorkflowStatusBadge } from '@/components/workflow/WorkflowStatusBadge';
import { ApprovalActions } from '@/components/workflow/ApprovalActions';
import { ActivityTimeline } from '@/components/workflow/ActivityTimeline';
import { RelatedList } from '@/components/objectui/RelatedList';
import { CloneRecordDialog } from '@/components/objectui/CloneRecordDialog';
import { Button } from '@/components/ui/button';
import { mockObjectDefinitions } from '@/lib/mock-data';
import type { RecordData } from '@/types/metadata';

export default function ObjectRecordPage() {
  const { appId, objectName, recordId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: record, isLoading: dataLoading } = useRecord({ objectName, recordId });
  const { data: workflowStatus } = useWorkflowStatus(recordId);
  const { data: activities } = useActivities(recordId);
  const createMutation = useCreateRecord({ objectName: objectName! });

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
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Record not found</h2>
        <p className="text-muted-foreground">The requested record does not exist.</p>
      </div>
    );
  }

  // Determine the record title from the primary field
  const primaryField = objectDef.primaryField ?? 'name';
  const recordTitle = String(record[primaryField] ?? record.id ?? 'Untitled');

  // Find related objects (objects with lookup/master_detail fields referencing this object)
  const relatedObjects = Object.entries(mockObjectDefinitions)
    .filter(([, def]) =>
      Object.values(def.fields).some(
        (f) => (f.type === 'lookup' || f.type === 'master_detail') && f.reference === objectName,
      ),
    )
    .map(([name, def]) => {
      const fkField = Object.entries(def.fields).find(
        ([, f]) =>
          (f.type === 'lookup' || f.type === 'master_detail') && f.reference === objectName,
      );
      return {
        objectName: name,
        foreignKeyField: fkField?.[0] ?? '',
        label: def.pluralLabel ?? def.label ?? name,
      };
    });

  const handleTransition = async (transition: { name: string }) => {
    if (!objectName || !recordId) return;
    try {
      await objectStackClient.data.update(objectName, recordId, {
        _workflow_transition: transition.name,
      });
      await queryClient.invalidateQueries({ queryKey: ['workflow', 'status', recordId] });
      await queryClient.invalidateQueries({ queryKey: ['record', objectName, recordId] });
      await queryClient.invalidateQueries({ queryKey: ['activities', recordId] });
    } catch (error) {
      console.error(
        `Failed to execute transition: ${transition.name} on record ${recordId}`,
        error,
      );
    }
  };

  // Clone record handler — I.5
  const handleClone = (data: Partial<RecordData>) => {
    createMutation.mutate(data, {
      onSuccess: (clonedRecord) => {
        const newId = clonedRecord?.id ?? '';
        if (newId) {
          navigate(`/apps/${appId}/${objectName}/${newId}`);
        } else {
          navigate(`/apps/${appId}/${objectName}`);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Back link + title + workflow status */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link to={`/apps/${appId}/${objectName}`}>
            <ArrowLeft className="mr-2 size-4" />
            {objectDef.pluralLabel ?? objectDef.label ?? objectName}
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{recordTitle}</h2>
          {workflowStatus && <WorkflowStatusBadge status={workflowStatus} />}
          <div className="flex items-center gap-2 sm:ml-auto">
            {/* Clone — I.5 */}
            <CloneRecordDialog
              objectDef={objectDef}
              record={record}
              onClone={handleClone}
              isLoading={createMutation.isPending}
            />
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to={`/apps/${appId}/${objectName}/${recordId}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">{objectDef.label ?? objectName} Detail</p>
      </div>

      {/* Approval actions */}
      {workflowStatus && workflowStatus.availableTransitions.length > 0 && (
        <ApprovalActions status={workflowStatus} onTransition={handleTransition} />
      )}

      {/* SchemaRenderer detail view — H.1.2 */}
      <div data-testid="schema-renderer-detail">
        <SchemaRenderer
          adapter={objectUIAdapter}
          objectName={objectName!}
          view="detail"
          recordId={recordId}
        />
      </div>

      {/* Related lists — H.4.3 */}
      {relatedObjects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Related Records</h3>
          {relatedObjects.map((rel) => (
            <RelatedList
              key={rel.objectName}
              objectName={rel.objectName}
              foreignKeyField={rel.foreignKeyField}
              parentRecordId={recordId!}
              basePath={`/apps/${appId}/${rel.objectName}`}
            />
          ))}
        </div>
      )}

      {/* Activity timeline */}
      {activities && activities.length > 0 && (
        <ActivityTimeline activities={activities} maxItems={10} />
      )}
    </div>
  );
}
