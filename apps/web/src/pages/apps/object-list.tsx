/**
 * Object List Page — displays records of a specific object as a data table,
 * kanban board, or calendar (switchable via ViewSwitcher).
 *
 * Uses @object-ui SchemaRenderer for grid, kanban, and calendar views (Phase H).
 * Falls back to built-in components when SchemaRenderer is not suitable.
 *
 * Route: /apps/:appId/:objectName
 */

import { useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';
import { useObjectDefinition } from '@/hooks/use-metadata';
import { useRecords } from '@/hooks/use-records';
import { ObjectToolbar } from '@/components/objectui/ObjectToolbar';
import { FilterPanel } from '@/components/objectui/FilterPanel';
import type { FilterValue } from '@/components/objectui/FilterPanel';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types/workflow';

export default function ObjectListPage() {
  const { appId, objectName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Server-side pagination (H.3.2)
  const currentPage = Number(searchParams.get('page') ?? '1');
  const pageSize = 20;

  const { data: objectDef, isLoading: metaLoading } = useObjectDefinition(objectName);
  const { data: result, isLoading: dataLoading } = useRecords({
    objectName,
    page: currentPage,
    pageSize,
  });

  const isLoading = metaLoading || dataLoading;

  const handlePageChange = useCallback(
    (page: number) => {
      setSearchParams({ page: String(page) });
    },
    [setSearchParams],
  );

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

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const createPath = `/apps/${appId}/${objectName}/new`;

  // Map view mode to SchemaRenderer view name
  const schemaView =
    viewMode === 'table' ? 'grid' : viewMode === 'kanban' ? 'kanban' : 'calendar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {objectDef.pluralLabel ?? objectDef.label ?? objectName}
        </h2>
        {objectDef.description && (
          <p className="text-muted-foreground">{objectDef.description}</p>
        )}
      </div>

      {/* Toolbar — H.4.2 */}
      <ObjectToolbar
        objectDef={objectDef}
        total={total}
        viewMode={viewMode}
        onViewChange={setViewMode}
        createPath={createPath}
      />

      {/* Filter panel — H.4.4 */}
      <FilterPanel
        objectDef={objectDef}
        filters={filters}
        onFiltersChange={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* SchemaRenderer view — H.1.1, H.1.5, H.1.6 */}
      <div data-testid="schema-renderer-container">
        <SchemaRenderer
          adapter={objectUIAdapter}
          objectName={objectName!}
          view={schemaView}
        />
      </div>

      {/* Pagination — H.3.2 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({total} total records)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
