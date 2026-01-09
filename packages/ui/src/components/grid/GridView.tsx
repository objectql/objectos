import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../Button"
import { Badge } from "../Badge"
import { Checkbox } from "../Checkbox"
import { Copy, Trash2, GripVertical, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

interface Column {
  id: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select' | 'badge' | 'boolean'
  width?: number | string
  editable?: boolean
  sortable?: boolean
  options?: Array<{ value: string; label: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }>
}

interface SortConfig {
  columnId: string
  direction: 'asc' | 'desc'
}

interface GridViewProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void
  onDelete?: (row: any, index: number) => void
  className?: string
  emptyMessage?: string
  // Row selection and bulk operations
  enableRowSelection?: boolean
  onBulkDelete?: (rows: any[]) => void
  // Grouping
  enableGrouping?: boolean
  groupByColumn?: string
  // Copy/Paste
  enableCopyPaste?: boolean
  // Drag & Drop for column reordering
  enableColumnDragDrop?: boolean
  onColumnReorder?: (columns: Column[]) => void
  // Sorting
  enableSorting?: boolean
  onSortChange?: (sorts: SortConfig[]) => void
}

export function GridView({
  columns: initialColumns,
  data,
  onRowClick,
  onCellEdit,
  onDelete,
  className,
  emptyMessage = "No records found",
  enableRowSelection = false,
  onBulkDelete,
  enableGrouping = false,
  groupByColumn,
  enableCopyPaste = false,
  enableColumnDragDrop = false,
  onColumnReorder,
  enableSorting = true,
  onSortChange,
}: GridViewProps) {
  const [editingCell, setEditingCell] = React.useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = React.useState<any>('')
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set())
  const [columns, setColumns] = React.useState(initialColumns)
  const [draggedColumn, setDraggedColumn] = React.useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<number | null>(null)
  const [sorts, setSorts] = React.useState<SortConfig[]>([])

  // Update columns when initialColumns change
  React.useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  // Notify parent of sort changes
  React.useEffect(() => {
    if (onSortChange) {
      onSortChange(sorts)
    }
  }, [sorts, onSortChange])

  // Handle column header click for sorting
  const handleSort = (columnId: string, shiftKey: boolean) => {
    if (!enableSorting) return

    const column = columns.find(c => c.id === columnId)
    if (column && column.sortable === false) return

    setSorts(prevSorts => {
      const existingIndex = prevSorts.findIndex(s => s.columnId === columnId)
      
      if (shiftKey) {
        // Multi-column sorting with Shift+Click
        if (existingIndex >= 0) {
          // Toggle direction or remove
          const existing = prevSorts[existingIndex]
          if (existing.direction === 'asc') {
            return prevSorts.map((s, i) => 
              i === existingIndex ? { ...s, direction: 'desc' as const } : s
            )
          } else {
            return prevSorts.filter((_, i) => i !== existingIndex)
          }
        } else {
          // Add new sort
          return [...prevSorts, { columnId, direction: 'asc' }]
        }
      } else {
        // Single column sorting
        if (existingIndex === 0 && prevSorts.length === 1) {
          // Toggle direction or clear
          const existing = prevSorts[0]
          if (existing.direction === 'asc') {
            return [{ columnId, direction: 'desc' }]
          } else {
            return []
          }
        } else {
          // Replace all sorts with this one
          return [{ columnId, direction: 'asc' }]
        }
      }
    })
  }

  // Get sort info for a column
  const getSortInfo = (columnId: string): { index: number; direction: 'asc' | 'desc' } | null => {
    const index = sorts.findIndex(s => s.columnId === columnId)
    if (index >= 0) {
      return { index, direction: sorts[index].direction }
    }
    return null
  }

  // Sort data based on current sorts
  const sortData = (dataToSort: any[]) => {
    if (!enableSorting || sorts.length === 0) {
      return dataToSort
    }

    return [...dataToSort].sort((a, b) => {
      for (const sort of sorts) {
        const column = columns.find(c => c.id === sort.columnId)
        if (!column) continue

        let aVal = a[sort.columnId]
        let bVal = b[sort.columnId]

        // Handle null/undefined
        if (aVal == null && bVal == null) continue
        if (aVal == null) return 1
        if (bVal == null) return -1

        // Type-specific comparison
        let comparison = 0
        if (column.type === 'number') {
          comparison = Number(aVal) - Number(bVal)
        } else if (column.type === 'date') {
          comparison = new Date(aVal).getTime() - new Date(bVal).getTime()
        } else if (column.type === 'boolean') {
          comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0)
        } else {
          // Text comparison (case-insensitive)
          comparison = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' })
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison
        }
      }
      return 0
    })
  }

  // Group data if grouping is enabled and create index map for performance
  const { groupedData, rowIndexMap } = React.useMemo(() => {
    // Sort data first
    const sortedData = sortData(data)

    // Create a map for O(1) index lookups
    const indexMap = new Map<any, number>()
    data.forEach((row, index) => {
      indexMap.set(row, index)
    })

    if (!enableGrouping || !groupByColumn) {
      return { groupedData: { ungrouped: sortedData }, rowIndexMap: indexMap }
    }
    
    const groups: Record<string, any[]> = {}
    sortedData.forEach(row => {
      const groupValue = row[groupByColumn] || 'Ungrouped'
      if (!groups[groupValue]) {
        groups[groupValue] = []
      }
      groups[groupValue].push(row)
    })
    return { groupedData: groups, rowIndexMap: indexMap }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enableGrouping, groupByColumn, sorts, enableSorting])

  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(Object.keys(groupedData))
  )

  // Update expanded groups when groupedData changes
  React.useEffect(() => {
    setExpandedGroups(new Set(Object.keys(groupedData)))
  }, [groupedData])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // Row selection handlers
  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)))
    }
  }

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      const rowsToDelete = Array.from(selectedRows).map(i => data[i])
      onBulkDelete(rowsToDelete)
      setSelectedRows(new Set())
    }
  }

  // Copy functionality
  const handleCopy = () => {
    if (!enableCopyPaste || selectedRows.size === 0) return

    const headers = columns.map(col => col.label).join('\t')
    const rows = Array.from(selectedRows)
      .map(i => data[i])
      .map(row => 
        columns.map(col => {
          const value = row[col.id]
          return value !== null && value !== undefined ? String(value) : ''
        }).join('\t')
      )
      .join('\n')

    const tsv = headers + '\n' + rows
    
    // Use modern clipboard API with error handling
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).catch(err => {
        console.error('Failed to copy to clipboard:', err)
        // Fallback: show user a message or use document.execCommand as last resort
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
  }

  // Column drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!enableColumnDragDrop) return
    setDraggedColumn(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!enableColumnDragDrop) return
    e.preventDefault()
    setDragOverColumn(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!enableColumnDragDrop || draggedColumn === null) return
    e.preventDefault()

    const newColumns = [...columns]
    const [removed] = newColumns.splice(draggedColumn, 1)
    newColumns.splice(dropIndex, 0, removed)
    
    setColumns(newColumns)
    onColumnReorder?.(newColumns)
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const startEdit = (rowIndex: number, columnId: string, currentValue: any) => {
    const column = columns.find(c => c.id === columnId)
    if (!column?.editable) return
    
    // Don't allow inline editing for badge, select, and boolean types
    // These should use the row click to edit in a form
    if (column.type === 'badge' || column.type === 'select' || column.type === 'boolean') {
      return
    }
    
    setEditingCell({ row: rowIndex, col: columnId })
    setEditValue(currentValue || '')
  }

  const saveEdit = () => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.row, editingCell.col, editValue)
    }
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const renderCell = (row: any, column: Column, rowIndex: number) => {
    const value = row[column.id]
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.id

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            onBlur={saveEdit}
            className="flex-1 h-7 px-2 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )
    }

    // Render based on type
    if (column.type === 'badge' && column.options) {
      const option = column.options.find(opt => opt.value === value)
      if (option) {
        return <Badge variant={option.variant || 'default'}>{option.label}</Badge>
      }
    }

    if (column.type === 'select' && column.options) {
      const option = column.options.find(opt => opt.value === value)
      return <span>{option?.label || value || '-'}</span>
    }

    if (column.type === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={!!value}
            readOnly
            className="w-4 h-4 rounded border-stone-300 text-blue-600"
          />
        </div>
      )
    }

    if (column.type === 'date' && value) {
      return <span>{new Date(value).toLocaleDateString()}</span>
    }

    return <span>{value || '-'}</span>
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
        <svg
          className="w-14 h-14 mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  const hasSelection = selectedRows.size > 0

  return (
    <div className={cn("w-full", className)}>
      {/* Apple-style bulk actions toolbar */}
      {enableRowSelection && hasSelection && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-blue-50 border border-blue-200/60 rounded-lg shadow-sm animate-slideIn">
          <span className="text-sm font-medium text-blue-900">
            {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex gap-2 ml-auto">
            {enableCopyPaste && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRows(new Set())}
              className="h-8"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-auto border border-gray-200/60 rounded-xl shadow-sm bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 group">
              {enableRowSelection && (
                <th className="px-4 py-3 w-12 border-r border-gray-200/60">
                  <Checkbox
                    checked={selectedRows.size === data.length}
                    onCheckedChange={toggleAllRows}
                  />
                </th>
              )}
              {columns.map((column, index) => {
                const sortInfo = getSortInfo(column.id)
                const isSortable = enableSorting && column.sortable !== false
                
                return (
                  <th
                    key={column.id}
                    style={{ width: column.width }}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200/60 last:border-r-0",
                      enableColumnDragDrop && "cursor-move select-none",
                      isSortable && !enableColumnDragDrop && "cursor-pointer hover:bg-gray-100 transition-apple",
                      dragOverColumn === index && "bg-blue-100"
                    )}
                    draggable={enableColumnDragDrop}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      if (isSortable && !enableColumnDragDrop) {
                        handleSort(column.id, e.shiftKey)
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {enableColumnDragDrop && (
                        <GripVertical className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="flex-1">{column.label}</span>
                      {isSortable && (
                        <div className="flex items-center">
                          {sortInfo ? (
                            <div className="flex items-center gap-0.5">
                              {sortInfo.direction === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              {sorts.length > 1 && (
                                <span className="text-[10px] font-bold text-blue-600 ml-0.5">
                                  {sortInfo.index + 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
              {onDelete && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {enableGrouping && groupByColumn ? (
              // Render grouped data
              Object.entries(groupedData).map(([groupKey, groupRows]) => (
                <React.Fragment key={groupKey}>
                  <tr className="bg-stone-100 border-b border-stone-200">
                    <td
                      colSpan={
                        columns.length +
                        (enableRowSelection ? 1 : 0) +
                        (onDelete ? 1 : 0)
                      }
                      className="px-4 py-2"
                    >
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="flex items-center gap-2 font-medium text-stone-900 hover:text-stone-700"
                      >
                        <svg
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedGroups.has(groupKey) && "rotate-90"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        {groupKey} ({groupRows.length})
                      </button>
                    </td>
                  </tr>
                  {expandedGroups.has(groupKey) &&
                    groupRows.map((row) => {
                      const actualIndex = rowIndexMap.get(row) ?? -1
                      return (
                        <tr
                          key={actualIndex}
                          className={cn(
                            "border-b border-gray-100 hover:bg-gray-50 transition-apple group",
                            onRowClick && "cursor-pointer"
                          )}
                          onClick={() => onRowClick?.(row)}
                        >
                          {enableRowSelection && (
                            <td 
                              className="px-4 py-2.5 border-r border-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selectedRows.has(actualIndex)}
                                onCheckedChange={() => toggleRowSelection(actualIndex)}
                              />
                            </td>
                          )}
                          {columns.map((column) => (
                            <td
                              key={column.id}
                              className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                              onClick={(e) => {
                                if (column.editable) {
                                  e.stopPropagation()
                                  startEdit(actualIndex, column.id, row[column.id])
                                }
                              }}
                            >
                              {renderCell(row, column, actualIndex)}
                            </td>
                          ))}
                          {onDelete && (
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(row, actualIndex)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-apple text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                </React.Fragment>
              ))
            ) : (
              // Render ungrouped data
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-apple group",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {enableRowSelection && (
                    <td 
                      className="px-4 py-2.5 border-r border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                      onClick={(e) => {
                        if (column.editable) {
                          e.stopPropagation()
                          startEdit(rowIndex, column.id, row[column.id])
                        }
                      }}
                    >
                      {renderCell(row, column, rowIndex)}
                    </td>
                  ))}
                  {onDelete && (
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(row, rowIndex)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-apple text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Export types for external use
export type { SortConfig, Column }
