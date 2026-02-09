/**
 * Object Record Page — displays a single record's fields,
 * workflow status, approval actions, and activity timeline.
 *
 * Route: /apps/:appId/:objectName/:recordId
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecord } from '@/hooks/use-records';
import { useWorkflowStatus, useActivities } from '@/hooks/use-workflow';
import { objectStackClient } from '@/lib/api';
import { FieldRenderer } from '@/components/records/FieldRenderer';
import { WorkflowStatusBadge } from '@/components/workflow/WorkflowStatusBadge';
import { ApprovalActions } from '@/components/workflow/ApprovalActions';
import { ActivityTimeline } from '@/components/workflow/ActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { resolveFields } from '@/types/metadata';

export default function ObjectRecordPage() {
  const { appId, objectName, recordId } = useParams();
  const queryClient = useQueryClient();

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: record, isLoading: dataLoading } = useRecord({ objectName, recordId });
  const { data: workflowStatus } = useWorkflowStatus(recordId);
  const { data: activities } = useActivities(recordId);

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
  const allFields = resolveFields(objectDef.fields, ['id']);
  const editableFields = allFields.filter((f) => !f.readonly);
  const readonlyFields = allFields.filter((f) => f.readonly);

  const handleTransition = async (transition: { name: string }) => {
    if (!objectName || !recordId) return;
    try {
      await objectStackClient.data.update(objectName, recordId, {
        _workflow_transition: transition.name,
      });
      // Refresh workflow status and record data after transition
      await queryClient.invalidateQueries({ queryKey: ['workflow', 'status', recordId] });
      await queryClient.invalidateQueries({ queryKey: ['record', objectName, recordId] });
      await queryClient.invalidateQueries({ queryKey: ['activities', recordId] });
    } catch (error) {
      console.error(`Failed to execute transition: ${transition.name} on record ${recordId}`, error);
    }
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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">{recordTitle}</h2>
          {workflowStatus && <WorkflowStatusBadge status={workflowStatus} />}
        </div>
        <p className="text-muted-foreground">{objectDef.label ?? objectName} Detail</p>
      </div>

      {/* Approval actions */}
      {workflowStatus && workflowStatus.availableTransitions.length > 0 && (
        <ApprovalActions status={workflowStatus} onTransition={handleTransition} />
      )}

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

      {/* Activity timeline */}
      {activities && activities.length > 0 && (
        <ActivityTimeline activities={activities} maxItems={10} />
      )}
    </div>
  );
}
