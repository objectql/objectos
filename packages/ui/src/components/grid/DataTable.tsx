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
  // New props for enhanced filtering
  enableMultipleFilters?: boolean
  filterConfigs?: FilterConfig[]
  showFilterCount?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filter...",
  enableMultipleFilters = false,
  filterConfigs = [],
  showFilterCount = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const clearAllFilters = () => {
    table.resetColumnFilters()
  }

  const activeFiltersCount = columnFilters.length

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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
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
