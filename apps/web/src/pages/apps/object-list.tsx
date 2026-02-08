/**
 * Object List Page — displays records of a specific object as a data table,
 * kanban board, or calendar (switchable via ViewSwitcher).
 *
 * Route: /apps/:appId/:objectName
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecords } from '@/hooks/use-records';
import { RecordTable } from '@/components/records/RecordTable';
import { KanbanBoard } from '@/components/objectui/KanbanBoard';
import { ViewSwitcher, findKanbanField } from '@/components/objectui/ViewSwitcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types/workflow';

export default function ObjectListPage() {
  const { appId, objectName } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: result, isLoading: dataLoading } = useRecords({ objectName });

  const isLoading = metaLoading || dataLoading;

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
          <Link to={`/apps/${appId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to app
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Object not found</h2>
        <p className="text-muted-foreground">
          The object &ldquo;{objectName}&rdquo; is not defined in this application.
        </p>
      </div>
    );
  }

  const records = result?.records ?? [];
  const total = result?.total ?? 0;
  const kanbanField = findKanbanField(objectDef);
  const basePath = `/apps/${appId}/${objectName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{objectDef.pluralLabel ?? objectDef.label ?? objectName}</h2>
          {objectDef.description && (
            <p className="text-muted-foreground">{objectDef.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher
            currentView={viewMode}
            onViewChange={setViewMode}
            objectDef={objectDef}
          />
          <Badge variant="secondary">{total} records</Badge>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'table' && (
        <RecordTable
          objectDef={objectDef}
          records={records}
          basePath={basePath}
        />
      )}

      {viewMode === 'kanban' && kanbanField && (
        <KanbanBoard
          objectDef={objectDef}
          records={records}
          basePath={basePath}
          groupField={kanbanField}
        />
      )}

      {viewMode === 'calendar' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-lg font-medium">Calendar view</p>
          <p className="text-sm text-muted-foreground">
            Calendar view coming soon — records with date fields will be displayed here.
          </p>
        </div>
      )}
    </div>
  );
}
