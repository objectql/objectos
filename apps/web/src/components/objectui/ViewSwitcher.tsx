/**
 * ViewSwitcher — toggle between Table / Kanban / Calendar views.
 *
 * Provides a segmented control to switch the display mode for object
 * list pages. Only enables Kanban if the object has a suitable select field.
 */

import { LayoutGrid, Table2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types/workflow';
import type { ObjectDefinition } from '@/types/metadata';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  objectDef?: ObjectDefinition;
}

/**
 * Determine the select/status field suitable for kanban grouping.
 * Returns the field name or undefined if no suitable field exists.
 */
export function findKanbanField(objectDef: ObjectDefinition): string | undefined {
  const candidates = Object.entries(objectDef.fields)
    .filter(
      ([, f]) => (f.type === 'select' || f.type === 'radio') && f.options && f.options.length >= 2,
    )
    .map(([key]) => key);

  // Prefer common status/stage field names
  const preferred = ['status', 'stage', 'state', 'priority'];
  for (const name of preferred) {
    if (candidates.includes(name)) return name;
  }
  return candidates[0];
}

const views: { mode: ViewMode; label: string; icon: typeof Table2 }[] = [
  { mode: 'table', label: 'Table', icon: Table2 },
  { mode: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { mode: 'calendar', label: 'Calendar', icon: CalendarDays },
];

export function ViewSwitcher({ currentView, onViewChange, objectDef }: ViewSwitcherProps) {
  const hasKanbanField = objectDef ? !!findKanbanField(objectDef) : false;
  const hasDateField = objectDef
    ? Object.values(objectDef.fields).some((f) => f.type === 'date' || f.type === 'datetime')
    : false;

  return (
    <div
      className="flex items-center rounded-lg border bg-muted/30 p-0.5"
      role="group"
      aria-label="View mode"
    >
      {views.map(({ mode, label, icon: Icon }) => {
        // Disable kanban if no suitable field, disable calendar if no date field
        const disabled =
          (mode === 'kanban' && !hasKanbanField) || (mode === 'calendar' && !hasDateField);

        return (
          <Button
            key={mode}
            variant={currentView === mode ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1.5 px-3"
            onClick={() => onViewChange(mode)}
            disabled={disabled}
            title={disabled ? `No suitable field for ${label} view` : `Switch to ${label} view`}
            aria-pressed={currentView === mode}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
