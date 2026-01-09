# Airtable-like UI Components Guide

This guide demonstrates how to use ObjectQL's UI components to build an Airtable-like application with a modern, intuitive interface.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Field Types](#field-types)
4. [Building a Complete View](#building-a-complete-view)
5. [Examples](#examples)

## Overview

ObjectQL UI provides a comprehensive set of components to build data-centric applications similar to Airtable, including:

- **GridView**: Airtable-style grid with inline editing
- **Toolbar & ViewSwitcher**: Navigation and view controls
- **Field Components**: Various field types (text, select, date, badge, etc.)
- **AutoForm**: Automatic form generation from schema
- **Modal**: For create/edit dialogs

## Core Components

### GridView

The GridView component provides an Airtable-like grid interface with support for multiple column types and inline editing.

```tsx
import { GridView } from '@objectql/ui'

const columns = [
  { id: 'name', label: 'Name', type: 'text', width: 200, editable: true },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'badge',
    options: [
      { value: 'active', label: 'Active', variant: 'success' },
      { value: 'pending', label: 'Pending', variant: 'warning' },
    ]
  },
  { id: 'date', label: 'Date', type: 'date', width: 150 },
]

<GridView
  columns={columns}
  data={data}
  onCellEdit={(rowIndex, columnId, value) => {
    // Handle cell edit
  }}
  onRowClick={(row) => {
    // Handle row click
  }}
  onDelete={(row, index) => {
    // Handle delete
  }}
/>
```

**Props:**
- `columns`: Array of column definitions
- `data`: Array of data rows
- `onCellEdit`: Callback for inline editing (optional)
- `onRowClick`: Callback when row is clicked (optional)
- `onDelete`: Callback for delete action (optional)
- `emptyMessage`: Message shown when no data (optional)
- `enableSorting`: Enable sorting on column headers (default: true)
- `onSortChange`: Callback when sort configuration changes (optional)
- `enableRowSelection`: Enable row selection checkboxes (optional)
- `enableGrouping`: Enable grouping by column (optional)
- `enableCopyPaste`: Enable copy/paste functionality (optional)
- `enableColumnDragDrop`: Enable column reordering via drag & drop (optional)

**Column Types:**
- `text`: Plain text (editable)
- `number`: Numeric values (editable)
- `date`: Date values with date picker
- `select`: Dropdown selection
- `badge`: Status badges with colors
- `boolean`: Checkbox

**Column Properties:**
- `id`: Unique column identifier (required)
- `label`: Column header label (required)
- `type`: Column data type (optional)
- `width`: Column width in pixels or string (optional)
- `editable`: Enable inline editing for this column (optional)
- `sortable`: Enable/disable sorting for this column (default: true when enableSorting is true)
- `options`: Options for badge/select types (optional)

### Sorting

GridView supports single and multi-column sorting similar to Airtable:

**Single Column Sorting:**
- Click on a column header to sort ascending
- Click again to sort descending
- Click a third time to remove sorting

**Multi-Column Sorting:**
- Hold Shift and click column headers to add additional sort levels
- Each sorted column shows its sort direction (↑ for ascending, ↓ for descending)
- Multi-column sorts show sort priority numbers (1, 2, 3, etc.)

**Example:**

```tsx
import { GridView, SortConfig } from '@objectql/ui'

function MyComponent() {
  const [sorts, setSorts] = useState<SortConfig[]>([])

  const handleSortChange = (newSorts: SortConfig[]) => {
    setSorts(newSorts)
    console.log('Active sorts:', newSorts)
    // Example output: [
    //   { columnId: 'priority', direction: 'desc' },
    //   { columnId: 'name', direction: 'asc' }
    // ]
  }

  return (
    <GridView
      columns={columns}
      data={data}
      enableSorting={true}
      onSortChange={handleSortChange}
    />
  )
}
```

**Disabling Sorting for Specific Columns:**

```tsx
const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false }, // No sorting for this column
]
```

**Sorting Behavior:**
- Text fields: Case-insensitive alphabetical sorting
- Number fields: Numeric comparison
- Date fields: Chronological sorting
- Boolean fields: false before true
- Null/undefined values: Always sorted to the end

### Toolbar & ViewSwitcher

Toolbar provides a consistent header for your views with title, actions, and view switching.

```tsx
import { Toolbar, ViewSwitcher, ToolbarIcons } from '@objectql/ui'

<Toolbar
  title="Projects Database"
  subtitle="120 records"
>
  <ViewSwitcher
    views={[
      { id: 'grid', label: 'Grid', icon: <ToolbarIcons.Grid /> },
      { id: 'list', label: 'List', icon: <ToolbarIcons.List /> },
    ]}
    activeView={activeView}
    onViewChange={setActiveView}
  />
  <Button onClick={handleFilter}>
    <ToolbarIcons.Filter />
    <span>Filter</span>
  </Button>
  <Button onClick={handleCreate}>
    <ToolbarIcons.Plus />
    <span>New</span>
  </Button>
</Toolbar>
```

**Available Icons:**
- `ToolbarIcons.Grid`
- `ToolbarIcons.List`
- `ToolbarIcons.Filter`
- `ToolbarIcons.Sort`
- `ToolbarIcons.Plus`
- `ToolbarIcons.Refresh`

### Badge Component

Badges are used to display status, categories, or any labeled information with color coding.

```tsx
import { Badge } from '@objectql/ui'

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>
<Badge variant="info">New</Badge>
<Badge variant="default">Draft</Badge>
```

**Variants:**
- `default`: Gray (neutral)
- `success`: Green (positive states)
- `warning`: Yellow (attention needed)
- `danger`: Red (errors, critical)
- `info`: Blue (informational)

### Select Component

A styled dropdown select component.

```tsx
import { Select } from '@objectql/ui'

<Select
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
/>
```

### Popover Component

A simple popover for dropdown menus and contextual actions.

```tsx
import { Popover } from '@objectql/ui'

<Popover
  trigger={<Button>Actions</Button>}
>
  <div className="space-y-1">
    <button className="w-full text-left px-3 py-2 hover:bg-stone-100">Edit</button>
    <button className="w-full text-left px-3 py-2 hover:bg-stone-100">Delete</button>
  </div>
</Popover>
```

## Field Types

ObjectQL provides specialized field components for forms:

### SelectField

```tsx
import { SelectField } from '@objectql/ui'

<SelectField
  name="status"
  label="Status"
  value={formData.status}
  onChange={(value) => setFormData({ ...formData, status: value })}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
  required
/>
```

### DateField

```tsx
import { DateField } from '@objectql/ui'

<DateField
  name="startDate"
  label="Start Date"
  value={formData.startDate}
  onChange={(value) => setFormData({ ...formData, startDate: value })}
/>
```

### BadgeField

For selecting status/category values displayed as badges:

```tsx
import { BadgeField } from '@objectql/ui'

<BadgeField
  name="priority"
  label="Priority"
  value={formData.priority}
  onChange={(value) => setFormData({ ...formData, priority: value })}
  options={[
    { value: 'high', label: 'High', variant: 'danger' },
    { value: 'medium', label: 'Medium', variant: 'warning' },
    { value: 'low', label: 'Low', variant: 'info' },
  ]}
/>
```

## Building a Complete View

Here's how to combine components to create a complete Airtable-like page:

```tsx
import React, { useState } from 'react'
import {
  GridView,
  Toolbar,
  ViewSwitcher,
  ToolbarIcons,
  Button,
  Modal,
  AutoForm,
} from '@objectql/ui'

function MyDataView() {
  const [data, setData] = useState([/* your data */])
  const [activeView, setActiveView] = useState('grid')
  const [showModal, setShowModal] = useState(false)

  const columns = [
    { id: 'name', label: 'Name', type: 'text', editable: true },
    { id: 'status', label: 'Status', type: 'badge', options: [...] },
  ]

  const schema = {
    fields: {
      name: { type: 'string', label: 'Name', required: true },
      status: { type: 'select', label: 'Status', options: ['active', 'inactive'] },
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar title="My Data" subtitle={`${data.length} records`}>
        <ViewSwitcher
          views={[
            { id: 'grid', label: 'Grid', icon: <ToolbarIcons.Grid /> },
          ]}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <Button onClick={() => setShowModal(true)}>
          <ToolbarIcons.Plus />
          <span>New Record</span>
        </Button>
      </Toolbar>

      <div className="flex-1 overflow-auto p-6">
        <GridView
          columns={columns}
          data={data}
          onCellEdit={(rowIndex, columnId, value) => {
            const newData = [...data]
            newData[rowIndex][columnId] = value
            setData(newData)
          }}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Record"
      >
        <AutoForm
          schema={schema}
          onSubmit={(formData) => {
            setData([...data, formData])
            setShowModal(false)
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}
```

## Examples

### Complete Airtable-like Example

See `examples/airtable-example.tsx` for a fully working example demonstrating:
- Grid view with inline editing
- Multiple field types (text, select, date, badge, boolean, number)
- Create/Edit modals with AutoForm
- View switching
- Toolbar with actions
- Delete functionality

### Simple Task Manager

```tsx
const taskColumns = [
  { id: 'task', label: 'Task', type: 'text', width: 300, editable: true },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'badge',
    options: [
      { value: 'todo', label: 'To Do', variant: 'default' },
      { value: 'doing', label: 'In Progress', variant: 'info' },
      { value: 'done', label: 'Done', variant: 'success' },
    ]
  },
  { id: 'dueDate', label: 'Due Date', type: 'date' },
  { id: 'completed', label: 'Done', type: 'boolean' },
]

<GridView
  columns={taskColumns}
  data={tasks}
  onCellEdit={handleEdit}
/>
```

### CRM Contacts

```tsx
const contactColumns = [
  { id: 'name', label: 'Name', type: 'text', width: 200, editable: true },
  { id: 'email', label: 'Email', type: 'text', width: 250, editable: true },
  { id: 'phone', label: 'Phone', type: 'text', width: 150, editable: true },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'badge',
    options: [
      { value: 'lead', label: 'Lead', variant: 'info' },
      { value: 'customer', label: 'Customer', variant: 'success' },
      { value: 'inactive', label: 'Inactive', variant: 'default' },
    ]
  },
  { id: 'lastContact', label: 'Last Contact', type: 'date' },
]

<GridView
  columns={contactColumns}
  data={contacts}
  onCellEdit={handleEdit}
  onRowClick={handleViewDetails}
/>
```

## Styling & Customization

All components are built with Tailwind CSS and support custom className props for additional styling:

```tsx
<GridView
  className="shadow-lg"
  columns={columns}
  data={data}
/>

<Badge className="text-xs" variant="success">
  Premium
</Badge>

<Toolbar className="bg-blue-50">
  {/* ... */}
</Toolbar>
```

## Best Practices

1. **Use consistent field types**: Match column types in GridView with field types in AutoForm
2. **Provide meaningful labels**: Use clear, descriptive labels for all fields
3. **Handle errors gracefully**: Show user-friendly error messages
4. **Enable inline editing selectively**: Only make fields editable that make sense to edit inline
5. **Use badges for status**: Status fields work best as badges rather than plain text
6. **Keep toolbar actions relevant**: Only show actions that are currently available

## Next Steps

- Explore the complete example in `examples/airtable-example.tsx`
- Check out the filter functionality in `FILTER_USAGE.md`
- See chart examples in `examples/chart-examples.tsx`
- Read the API documentation for each component
