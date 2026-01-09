/**
 * Example: Using DataTable with Enhanced Filter Functionality
 * 
 * This example demonstrates the various ways to use the filter features
 * in the ObjectQL DataTable component.
 */

import * as React from 'react'
import { DataTable } from '@objectql/ui'
import { ColumnDef } from '@tanstack/react-table'

// Example data type
type User = {
  id: string
  name: string
  email: string
  role: string
  status: string
  department: string
}

// Example data
const sampleData: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', department: 'Engineering' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', department: 'Marketing' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive', department: 'Sales' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'Manager', status: 'Active', department: 'Engineering' },
]

// Column definitions
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
]

// Example 1: Simple single column filter (legacy)
export function Example1_SingleFilter() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Example 1: Single Column Filter</h2>
      <DataTable
        columns={columns}
        data={sampleData}
        filterColumn="name"
        filterPlaceholder="Search by name..."
      />
    </div>
  )
}

// Example 2: Multiple column filters
export function Example2_MultipleFilters() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Example 2: Multiple Column Filters</h2>
      <DataTable
        columns={columns}
        data={sampleData}
        enableMultipleFilters={true}
        filterConfigs={[
          { columnId: 'name', label: 'Name', placeholder: 'Filter by name...' },
          { columnId: 'email', label: 'Email', placeholder: 'Filter by email...' },
          { columnId: 'role', label: 'Role', placeholder: 'Filter by role...' },
          { columnId: 'status', label: 'Status', placeholder: 'Filter by status...' },
          { columnId: 'department', label: 'Department', placeholder: 'Filter by department...' },
        ]}
      />
    </div>
  )
}

// Example 3: Multiple filters without filter count
export function Example3_NoFilterCount() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Example 3: Multiple Filters (No Count Display)</h2>
      <DataTable
        columns={columns}
        data={sampleData}
        enableMultipleFilters={true}
        filterConfigs={[
          { columnId: 'name', label: 'Name' },
          { columnId: 'status', label: 'Status' },
        ]}
        showFilterCount={false}
      />
    </div>
  )
}
