/**
 * SavedViewsPanel — manage saved filter/view configurations.
 *
 * Allows users to save, load, and delete named filter configurations
 * for each object. Persisted in localStorage per user per object.
 *
 * Phase I — Task I.3
 */

import { useState } from 'react';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FilterValue } from '@/components/objectui/FilterPanel';
import type { ViewMode } from '@/types/workflow';

export interface SavedView {
  id: string;
  name: string;
  filters: FilterValue[];
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  viewMode?: ViewMode;
  createdAt: string;
}

interface SavedViewsPanelProps {
  objectName: string;
  currentFilters: FilterValue[];
  currentViewMode?: ViewMode;
  currentSortField?: string;
  currentSortOrder?: 'asc' | 'desc';
  onLoadView: (view: SavedView) => void;
  savedViews: SavedView[];
  onSaveView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
}

export function SavedViewsPanel({
  currentFilters,
  currentViewMode,
  currentSortField,
  currentSortOrder,
  onLoadView,
  savedViews,
  onSaveView,
  onDeleteView,
}: SavedViewsPanelProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleSave = () => {
    if (!viewName.trim()) return;
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: viewName.trim(),
      filters: currentFilters,
      sortField: currentSortField,
      sortOrder: currentSortOrder,
      viewMode: currentViewMode,
      createdAt: new Date().toISOString(),
    };
    onSaveView(newView);
    setViewName('');
    setShowSaveDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2" data-testid="saved-views-panel">
        <Bookmark className="size-4 text-muted-foreground" />
        {savedViews.length === 0 ? (
          <span className="text-sm text-muted-foreground">No saved views</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {savedViews.map((view) => (
              <div key={view.id} className="flex items-center gap-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => onLoadView(view)}
                >
                  {view.name}
                  {view.filters.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 size-4 justify-center rounded-full p-0 text-[10px]">
                      {view.filters.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => onDeleteView(view.id)}
                  aria-label={`Delete view ${view.name}`}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 gap-1 text-xs"
          onClick={() => setShowSaveDialog(true)}
          disabled={currentFilters.length === 0}
        >
          <Plus className="size-3" />
          Save view
        </Button>
      </div>

      {/* Save view dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>
              Save the current filters and view settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">View name</label>
              <Input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g., High priority tasks"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                aria-label="View name"
              />
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">This view will save:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1">
                  <Check className="size-3" />
                  {currentFilters.length} filter{currentFilters.length !== 1 ? 's' : ''}
                </li>
                {currentSortField && (
                  <li className="flex items-center gap-1">
                    <Check className="size-3" />
                    Sort by {currentSortField} ({currentSortOrder ?? 'asc'})
                  </li>
                )}
                {currentViewMode && (
                  <li className="flex items-center gap-1">
                    <Check className="size-3" />
                    View mode: {currentViewMode}
                  </li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!viewName.trim()}>
              Save view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
