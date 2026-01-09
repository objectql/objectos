import * as React from "react"
import { GridView } from "../src/components/grid/GridView"
import { DataTable } from "../src/components/grid/DataTable"
import { Button } from "../src/components/Button"
import { ColumnDef } from "@tanstack/react-table"

/**
 * Example: Advanced Table Features Demo
 * This demonstrates all the new table features:
 * 1. Grouping (分组)
 * 2. Inline Editing
 * 3. Bulk Operations (批量操作)
 * 4. Copy/Paste (复制粘贴)
 * 5. Drag & Drop Column Reordering (拖拽排序)
 */

// Sample data for demonstration
const sampleData = [
  {
    id: 1,
    name: 'Website Redesign',
    department: 'Engineering',
    status: 'active',
    priority: 'high',
    assignee: 'John Doe',
    startDate: '2024-01-15',
    budget: 50000,
  },
  {
    id: 2,
    name: 'Mobile App Development',
    department: 'Engineering',
    status: 'active',
    priority: 'high',
    assignee: 'Jane Smith',
    startDate: '2024-02-01',
    budget: 120000,
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    department: 'Marketing',
    status: 'pending',
    priority: 'medium',
    assignee: 'Bob Wilson',
    startDate: '2024-03-10',
    budget: 25000,
  },
  {
    id: 4,
    name: 'Database Migration',
    department: 'Engineering',
    status: 'active',
    priority: 'high',
    assignee: 'Alice Johnson',
    startDate: '2024-01-20',
    budget: 80000,
  },
  {
    id: 5,
    name: 'Brand Refresh',
    department: 'Marketing',
    status: 'pending',
    priority: 'low',
    assignee: 'Charlie Brown',
    startDate: '2024-04-01',
    budget: 15000,
  },
  {
    id: 6,
    name: 'Security Audit',
    department: 'Security',
    status: 'active',
    priority: 'high',
    assignee: 'David Lee',
    startDate: '2024-02-15',
    budget: 35000,
  },
]

// GridView columns configuration
const gridViewColumns = [
  { 
    id: 'name', 
    label: 'Project Name', 
    type: 'text' as const, 
    width: 200, 
    editable: true 
  },
  { 
    id: 'department', 
    label: 'Department', 
    type: 'text' as const, 
    width: 150 
  },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'badge' as const, 
    width: 120,
    options: [
      { value: 'active', label: 'Active', variant: 'success' as const },
      { value: 'pending', label: 'Pending', variant: 'warning' as const },
      { value: 'completed', label: 'Completed', variant: 'info' as const },
    ]
  },
  { 
    id: 'priority', 
    label: 'Priority', 
    type: 'badge' as const, 
    width: 100,
    options: [
      { value: 'high', label: 'High', variant: 'danger' as const },
      { value: 'medium', label: 'Medium', variant: 'warning' as const },
      { value: 'low', label: 'Low', variant: 'info' as const },
    ]
  },
  { 
    id: 'assignee', 
    label: 'Assignee', 
    type: 'text' as const, 
    width: 150, 
    editable: true 
  },
  { 
    id: 'startDate', 
    label: 'Start Date', 
    type: 'date' as const, 
    width: 150 
  },
  { 
    id: 'budget', 
    label: 'Budget', 
    type: 'number' as const, 
    width: 120, 
    editable: true 
  },
]

// DataTable columns configuration
const dataTableColumns: ColumnDef<typeof sampleData[0]>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variants: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-blue-100 text-blue-800',
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
  },
  {
    accessorKey: 'budget',
    header: 'Budget',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('budget'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
]

// Example 1: GridView with all features enabled
export function GridViewAdvancedExample() {
  const [data, setData] = React.useState(sampleData)
  const [columns, setColumns] = React.useState(gridViewColumns)

  const handleBulkDelete = (rows: any[]) => {
    console.log('Bulk deleting:', rows)
    const idsToDelete = new Set(rows.map(r => r.id))
    setData(prevData => prevData.filter(item => !idsToDelete.has(item.id)))
  }

  const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
    console.log('Cell edited:', { rowIndex, columnId, value })
    setData(prevData => {
      const newData = [...prevData]
      newData[rowIndex] = { ...newData[rowIndex], [columnId]: value }
      return newData
    })
  }

  const handleColumnReorder = (newColumns: typeof gridViewColumns) => {
    console.log('Columns reordered:', newColumns.map(c => c.id))
    setColumns(newColumns)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">GridView - Advanced Features Demo</h1>
        <p className="text-stone-600 mt-2">
          Demonstrates: Grouping, Row Selection, Bulk Operations, Copy/Paste, and Drag & Drop
        </p>
      </div>

      <div className="space-y-6">
        {/* Feature 1: Basic with Row Selection and Bulk Operations */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">1. Row Selection & Bulk Operations</h2>
          <p className="text-sm text-stone-600 mb-4">
            ✓ Select rows with checkboxes<br />
            ✓ Bulk delete selected rows<br />
            ✓ Copy selected rows to clipboard
          </p>
          <GridView
            columns={columns}
            data={data}
            enableRowSelection={true}
            enableCopyPaste={true}
            onBulkDelete={handleBulkDelete}
            onCellEdit={handleCellEdit}
          />
        </div>

        {/* Feature 2: Grouping by Department */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">2. Grouping (分组)</h2>
          <p className="text-sm text-stone-600 mb-4">
            ✓ Group data by department<br />
            ✓ Expand/collapse groups<br />
            ✓ Works with row selection
          </p>
          <GridView
            columns={columns}
            data={data}
            enableGrouping={true}
            groupByColumn="department"
            enableRowSelection={true}
            enableCopyPaste={true}
            onBulkDelete={handleBulkDelete}
            onCellEdit={handleCellEdit}
          />
        </div>

        {/* Feature 3: Drag & Drop Column Reordering */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">3. Drag & Drop Column Reordering</h2>
          <p className="text-sm text-stone-600 mb-4">
            ✓ Drag column headers to reorder<br />
            ✓ Visual feedback during drag<br />
            ✓ Persists column order
          </p>
          <GridView
            columns={columns}
            data={data}
            enableColumnDragDrop={true}
            onColumnReorder={handleColumnReorder}
            onCellEdit={handleCellEdit}
          />
        </div>

        {/* Feature 4: All Features Combined */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">4. All Features Combined</h2>
          <p className="text-sm text-stone-600 mb-4">
            ✓ Grouping + Row Selection + Bulk Operations + Copy/Paste + Drag & Drop
          </p>
          <GridView
            columns={columns}
            data={data}
            enableRowSelection={true}
            enableGrouping={true}
            groupByColumn="department"
            enableCopyPaste={true}
            enableColumnDragDrop={true}
            onBulkDelete={handleBulkDelete}
            onCellEdit={handleCellEdit}
            onColumnReorder={handleColumnReorder}
          />
        </div>
      </div>
    </div>
  )
}

// Example 2: DataTable with all features enabled
export function DataTableAdvancedExample() {
  const [data, setData] = React.useState(sampleData)

  const handleBulkDelete = (rows: typeof sampleData) => {
    console.log('Bulk deleting:', rows)
    const idsToDelete = new Set(rows.map(r => r.id))
    setData(prevData => prevData.filter(item => !idsToDelete.has(item.id)))
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">DataTable - Advanced Features Demo</h1>
        <p className="text-stone-600 mt-2">
          Demonstrates: Grouping, Row Selection, Bulk Operations, and Copy/Paste
        </p>
      </div>

      <div className="space-y-6">
        {/* Feature 1: Row Selection and Bulk Operations */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">1. Row Selection & Bulk Operations</h2>
          <DataTable
            columns={dataTableColumns}
            data={data}
            enableRowSelection={true}
            enableCopyPaste={true}
            onBulkDelete={handleBulkDelete}
          />
        </div>

        {/* Feature 2: With Grouping */}
        <div className="border border-stone-200 rounded-lg p-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">2. With Grouping by Department</h2>
          <DataTable
            columns={dataTableColumns}
            data={data}
            enableRowSelection={true}
            enableGrouping={true}
            groupByColumn="department"
            enableCopyPaste={true}
            onBulkDelete={handleBulkDelete}
          />
        </div>
      </div>
    </div>
  )
}

// Usage instructions
export const USAGE_GUIDE = `
# Advanced Table Features Usage Guide

## 1. Grouping (分组)
\`\`\`tsx
<GridView
  columns={columns}
  data={data}
  enableGrouping={true}
  groupByColumn="department"
/>
\`\`\`

## 2. Inline Editing
Columns with \`editable: true\` support inline editing for text, number, and date fields.
Click on a cell to edit, press Enter to save, Escape to cancel.

## 3. Bulk Operations (批量操作)
\`\`\`tsx
<GridView
  columns={columns}
  data={data}
  enableRowSelection={true}
  onBulkDelete={(rows) => {
    // Handle bulk delete
  }}
/>
\`\`\`

## 4. Copy/Paste (复制粘贴)
\`\`\`tsx
<GridView
  columns={columns}
  data={data}
  enableRowSelection={true}
  enableCopyPaste={true}
/>
\`\`\`
Select rows and click "Copy" button or use Ctrl+C to copy to clipboard as TSV.

## 5. Drag & Drop Column Reordering
\`\`\`tsx
<GridView
  columns={columns}
  data={data}
  enableColumnDragDrop={true}
  onColumnReorder={(newColumns) => {
    // Handle column reorder
  }}
/>
\`\`\`
Drag column headers to reorder them.
`
