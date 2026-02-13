/**
 * ObjectToolbar — view switcher + new record button + bulk actions.
 *
 * Provides a consistent toolbar for object list pages with:
 * - View mode switcher (table, kanban, calendar)
 * - New record button
 * - Bulk action dropdown for selected records
 * - Record count badge
 *
 * Task H.4.2
 */

import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ViewSwitcher } from '@/components/objectui/ViewSwitcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types/workflow';
import type { ObjectDefinition } from '@/types/metadata';

interface ObjectToolbarProps {
  objectDef: ObjectDefinition;
  total: number;
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  /** Base path for building the "new record" link */
  createPath?: string;
  /** Selected record IDs for bulk actions */
  selectedIds?: string[];
  onBulkDelete?: (ids: string[]) => void;
}

export function ObjectToolbar({
  objectDef,
  total,
  viewMode,
  onViewChange,
  createPath,
  selectedIds = [],
  onBulkDelete,
}: ObjectToolbarProps) {
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex items-center justify-between" data-testid="object-toolbar">
      <div className="flex items-center gap-3">
        <ViewSwitcher currentView={viewMode} onViewChange={onViewChange} objectDef={objectDef} />
        <Badge variant="secondary">{total} records</Badge>

        {hasSelection && (
          <div className="flex items-center gap-2 border-l pl-3">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            {onBulkDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => onBulkDelete(selectedIds)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {createPath && (
        <Button asChild size="sm" className="gap-1.5">
          <Link to={createPath}>
            <Plus className="size-4" />
            New {objectDef.label ?? objectDef.name}
          </Link>
        </Button>
      )}
    </div>
  );
}
