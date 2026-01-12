import * as React from "react"
import {
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  LayoutGridIcon,
  LayoutListIcon,
  TrashIcon,
  MoreHorizontalIcon,
  CalendarIcon,
  KanbanIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

/**
 * View mode type
 */
export type ViewMode = 'grid' | 'list' | 'kanban' | 'calendar'

/**
 * Props for GridToolbar component
 */
export interface GridToolbarProps {
  /** Number of selected items */
  selectedCount?: number
  /** Total number of items */
  totalCount?: number
  /** Current view mode */
  viewMode?: ViewMode
  /** Available view modes */
  availableViews?: ViewMode[]
  /** Whether search is enabled */
  enableSearch?: boolean
  /** Whether filter is enabled */
  enableFilter?: boolean
  /** Whether export is enabled */
  enableExport?: boolean
  /** Whether bulk actions are enabled */
  enableBulkActions?: boolean
  /** Search value */
  searchValue?: string
  /** Filter active state */
  filterActive?: boolean
  /** Callback when search value changes */
  onSearchChange?: (value: string) => void
  /** Callback when filter toggle is clicked */
  onFilterToggle?: () => void
  /** Callback when view mode changes */
  onViewModeChange?: (mode: ViewMode) => void
  /** Callback when export CSV is clicked */
  onExportCsv?: () => void
  /** Callback when export Excel is clicked */
  onExportExcel?: () => void
  /** Callback when bulk delete is clicked */
  onBulkDelete?: () => void
  /** Custom bulk actions */
  customBulkActions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
  /** Custom toolbar actions */
  customActions?: React.ReactNode
}

/**
 * GridToolbar - Action bar for grid operations
 * 
 * Features:
 * - Bulk actions
 * - Search/filter toggle
 * - View switcher
 * - Export button
 */
export function GridToolbar({
  selectedCount = 0,
  totalCount = 0,
  viewMode = 'grid',
  availableViews = ['grid', 'list'],
  enableSearch = true,
  enableFilter = true,
  enableExport = true,
  enableBulkActions = true,
  searchValue = "",
  filterActive = false,
  onSearchChange,
  onFilterToggle,
  onViewModeChange,
  onExportCsv,
  onExportExcel,
  onBulkDelete,
  customBulkActions = [],
  customActions,
}: GridToolbarProps) {
  const hasSelection = selectedCount > 0

  const viewIcons: Record<ViewMode, React.ReactNode> = {
    grid: <LayoutGridIcon className="h-4 w-4" />,
    list: <LayoutListIcon className="h-4 w-4" />,
    kanban: <KanbanIcon className="h-4 w-4" />,
    calendar: <CalendarIcon className="h-4 w-4" />,
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4 flex-1">
        {/* Search */}
        {enableSearch && (
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-8"
            />
          </div>
        )}

        {/* Filter Toggle */}
        {enableFilter && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filterActive ? "default" : "outline"}
                  size="sm"
                  onClick={onFilterToggle}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters
                  {filterActive && <Badge className="ml-2 h-5 px-1">On</Badge>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {filterActive ? "Hide filters" : "Show filters"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Bulk Actions */}
        {enableBulkActions && hasSelection && (
          <div className="flex items-center gap-2 pl-4 border-l">
            <Badge variant="secondary">
              {selectedCount} selected
            </Badge>

            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}

            {customBulkActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontalIcon className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {customBulkActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={action.onClick}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Custom Actions */}
        {customActions}

        {/* Export Menu */}
        {enableExport && (onExportCsv || onExportExcel) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportCsv && (
                <DropdownMenuItem onClick={onExportCsv}>
                  Export as CSV
                </DropdownMenuItem>
              )}
              {onExportExcel && (
                <DropdownMenuItem onClick={onExportExcel}>
                  Export as Excel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* View Switcher */}
        {availableViews.length > 1 && onViewModeChange && (
          <div className="flex items-center border rounded-md">
            {availableViews.map((view) => (
              <TooltipProvider key={view}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === view ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onViewModeChange(view)}
                      className="rounded-none first:rounded-l-md last:rounded-r-md"
                    >
                      {viewIcons[view]}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {view.charAt(0).toUpperCase() + view.slice(1)} view
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
