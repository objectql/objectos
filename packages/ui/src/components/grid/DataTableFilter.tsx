"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Input } from "../Input"
import { Button } from "../Button"

interface DataTableFilterProps<TData> {
  table: Table<TData>
  columnId: string
  placeholder?: string
  label?: string
  className?: string
}

/**
 * A standalone filter component for DataTable columns
 * Can be used to create custom filter UIs
 */
export function DataTableFilter<TData>({
  table,
  columnId,
  placeholder = "Filter...",
  label,
  className = "",
}: DataTableFilterProps<TData>) {
  const column = table.getColumn(columnId)

  if (!column) {
    console.warn(`Column "${columnId}" not found in table`)
    return null
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-stone-600">
          {label}
        </label>
      )}
      <Input
        placeholder={placeholder}
        value={(column.getFilterValue() as string) ?? ""}
        onChange={(event) => column.setFilterValue(event.target.value)}
      />
    </div>
  )
}

interface DataTableFiltersToolbarProps<TData> {
  table: Table<TData>
  filters: Array<{
    columnId: string
    label?: string
    placeholder?: string
  }>
  showClearButton?: boolean
}

/**
 * A toolbar component that displays multiple filters in a row
 */
export function DataTableFiltersToolbar<TData>({
  table,
  filters,
  showClearButton = true,
}: DataTableFiltersToolbarProps<TData>) {
  const activeFiltersCount = table.getState().columnFilters.length

  return (
    <div className="flex items-center gap-2 py-4">
      {filters.map((filter) => (
        <DataTableFilter
          key={filter.columnId}
          table={table}
          columnId={filter.columnId}
          placeholder={filter.placeholder}
          label={filter.label}
          className="flex-1"
        />
      ))}
      {showClearButton && activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
          className="shrink-0"
        >
          Clear ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}
