import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../Button"
import { Badge } from "../Badge"

interface Column {
  id: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select' | 'badge' | 'boolean'
  width?: number | string
  editable?: boolean
  options?: Array<{ value: string; label: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }>
}

interface GridViewProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void
  onDelete?: (row: any, index: number) => void
  className?: string
  emptyMessage?: string
}

export function GridView({
  columns,
  data,
  onRowClick,
  onCellEdit,
  onDelete,
  className,
  emptyMessage = "No records found"
}: GridViewProps) {
  const [editingCell, setEditingCell] = React.useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = React.useState<any>('')

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
      <div className="flex flex-col items-center justify-center py-12 text-stone-400">
        <svg
          className="w-12 h-12 mb-3"
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
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-auto border border-stone-200 rounded-lg", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200">
            {columns.map((column) => (
              <th
                key={column.id}
                style={{ width: column.width }}
                className="px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 last:border-r-0"
              >
                {column.label}
              </th>
            ))}
            {onDelete && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider w-20">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "border-b border-stone-100 hover:bg-stone-50 transition-colors group",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className="px-4 py-2.5 text-sm text-stone-900 border-r border-stone-100 last:border-r-0"
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-red-600"
                    title="Delete"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
