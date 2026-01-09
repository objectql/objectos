"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  RowSelectionState,
  getGroupedRowModel,
  getExpandedRowModel,
  GroupingState,
  ExpandedState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../Table"
import { Button } from "../Button"
import { Input } from "../Input"
import { Checkbox } from "../Checkbox"
import { ChevronRight, ChevronDown, Copy, Trash2 } from "lucide-react"

interface FilterConfig {
  columnId: string
  label?: string
  placeholder?: string
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  // Enhanced filtering
  enableMultipleFilters?: boolean
  filterConfigs?: FilterConfig[]
  showFilterCount?: boolean
  // Row selection and bulk operations
  enableRowSelection?: boolean
  onBulkDelete?: (rows: TData[]) => void
  onBulkUpdate?: (rows: TData[], updates: Partial<TData>) => void
  // Grouping
  enableGrouping?: boolean
  groupByColumn?: string
  // Copy/Paste
  enableCopyPaste?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filter...",
  enableMultipleFilters = false,
  filterConfigs = [],
  showFilterCount = true,
  enableRowSelection = false,
  onBulkDelete,
  onBulkUpdate,
  enableGrouping = false,
  groupByColumn,
  enableCopyPaste = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [grouping, setGrouping] = React.useState<GroupingState>(
    groupByColumn ? [groupByColumn] : []
  )
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  // Add selection column if row selection is enabled
  const enhancedColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    // Grouping
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: enableGrouping ? getExpandedRowModel() : undefined,
    onGroupingChange: enableGrouping ? setGrouping : undefined,
    onExpandedChange: enableGrouping ? setExpanded : undefined,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      ...(enableGrouping && { grouping, expanded }),
    },
  })

  const clearAllFilters = () => {
    table.resetColumnFilters()
  }

  const activeFiltersCount = columnFilters.length

  // Get selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (onBulkDelete && hasSelection) {
      const rowData = selectedRows.map(row => row.original)
      onBulkDelete(rowData)
      setRowSelection({})
    }
  }

  // Copy/Paste functionality
  const handleCopy = React.useCallback(() => {
    if (!enableCopyPaste || !hasSelection) return

    const headers = enhancedColumns
      .filter(col => col.id !== 'select')
      .map(col => typeof col.header === 'string' ? col.header : col.id)
      .join('\t')
    
    const rows = selectedRows.map(row => 
      enhancedColumns
        .filter(col => col.id !== 'select')
        .map(col => {
          const cell = row.getValue(col.id as string)
          return cell !== null && cell !== undefined ? String(cell) : ''
        })
        .join('\t')
    ).join('\n')

    const tsv = headers + '\n' + rows
    
    // Use modern clipboard API with error handling
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).catch(err => {
        console.error('Failed to copy to clipboard:', err)
      })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = tsv
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
      document.body.removeChild(textArea)
    }
  }, [enableCopyPaste, hasSelection, selectedRows, enhancedColumns])

  const renderFilters = () => {
    // If enableMultipleFilters is true and filterConfigs are provided
    if (enableMultipleFilters && filterConfigs.length > 0) {
      return (
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-stone-700">
              Filters
              {showFilterCount && activeFiltersCount > 0 && (
                <span className="ml-2 text-xs text-stone-500">
                  ({activeFiltersCount} active)
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterConfigs.map((config) => {
              const column = table.getColumn(config.columnId)
              if (!column) return null
              
              return (
                <div key={config.columnId} className="flex flex-col gap-1">
                  {config.label && (
                    <label className="text-xs font-medium text-stone-600">
                      {config.label}
                    </label>
                  )}
                  <Input
                    placeholder={config.placeholder || `Filter ${config.label || config.columnId}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value)
                    }
                    className="h-9"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Legacy single column filter support
    if (filterColumn) {
      return (
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder={filterPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          {showFilterCount && activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-2"
            >
              Clear
            </Button>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div>
      {/* Bulk actions toolbar */}
      {enableRowSelection && hasSelection && (
        <div className="flex items-center gap-2 p-2 mb-2 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-900">
            {selectedRows.length} row(s) selected
          </span>
          <div className="flex gap-2 ml-auto">
            {enableCopyPaste && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              className="h-8"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
      
      {renderFilters()}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    // Handle grouped rows
                    if (cell.getIsGrouped()) {
                      return (
                        <TableCell key={cell.id} colSpan={enhancedColumns.length}>
                          <button
                            onClick={row.getToggleExpandedHandler()}
                            className="flex items-center gap-2 font-medium text-stone-900 hover:text-stone-700"
                          >
                            {row.getIsExpanded() ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}{' '}
                            ({row.subRows.length})
                          </button>
                        </TableCell>
                      )
                    }

                    // Handle aggregated cells
                    if (cell.getIsAggregated()) {
                      return (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.aggregatedCell ??
                              cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    }

                    // Handle placeholder cells
                    if (cell.getIsPlaceholder()) {
                      return <TableCell key={cell.id} />
                    }

                    // Normal cells
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
