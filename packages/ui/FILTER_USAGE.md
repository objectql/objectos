# DataTable Filter Functionality

The ObjectQL DataTable component now includes enhanced filter functionality that supports both single-column and multi-column filtering.

## Features

- ✅ Single column filter (legacy support)
- ✅ Multiple column filters
- ✅ Filter count display
- ✅ Clear all filters button
- ✅ Responsive filter grid layout
- ✅ Standalone filter components for custom UIs

## Usage Examples

### 1. Basic Single Column Filter (Legacy)

```tsx
import { DataTable } from '@objectql/ui'

<DataTable
  columns={columns}
  data={data}
  filterColumn="name"
  filterPlaceholder="Search by name..."
/>
```

### 2. Multiple Column Filters

```tsx
import { DataTable } from '@objectql/ui'

<DataTable
  columns={columns}
  data={data}
  enableMultipleFilters={true}
  filterConfigs={[
    { columnId: 'name', label: 'Name', placeholder: 'Filter by name...' },
    { columnId: 'email', label: 'Email', placeholder: 'Filter by email...' },
    { columnId: 'status', label: 'Status', placeholder: 'Filter by status...' },
  ]}
  showFilterCount={true}
/>
```

### 3. Custom Filter UI with Standalone Components

```tsx
import { DataTable, DataTableFilter, DataTableFiltersToolbar } from '@objectql/ui'
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table'

function MyCustomTable() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      {/* Option A: Use the toolbar component */}
      <DataTableFiltersToolbar
        table={table}
        filters={[
          { columnId: 'name', label: 'Name' },
          { columnId: 'email', label: 'Email' },
        ]}
      />

      {/* Option B: Use individual filter components */}
      <div className="flex gap-4">
        <DataTableFilter
          table={table}
          columnId="name"
          label="Name"
          placeholder="Search names..."
        />
        <DataTableFilter
          table={table}
          columnId="status"
          label="Status"
          placeholder="Filter status..."
        />
      </div>

      {/* Render your table */}
      <Table>
        {/* ... table content ... */}
      </Table>
    </div>
  )
}
```

## API Reference

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | - | Table column definitions |
| `data` | `TData[]` | - | Table data |
| `filterColumn` | `string` | - | (Legacy) Single column to filter |
| `filterPlaceholder` | `string` | `"Filter..."` | (Legacy) Placeholder for single filter |
| `enableMultipleFilters` | `boolean` | `false` | Enable multiple column filtering |
| `filterConfigs` | `FilterConfig[]` | `[]` | Configuration for multiple filters |
| `showFilterCount` | `boolean` | `true` | Show active filter count |

### FilterConfig

```typescript
interface FilterConfig {
  columnId: string      // Column ID to filter
  label?: string        // Label displayed above filter input
  placeholder?: string  // Input placeholder text
}
```

### DataTableFilter Props

| Prop | Type | Description |
|------|------|-------------|
| `table` | `Table<TData>` | TanStack table instance |
| `columnId` | `string` | Column ID to filter |
| `placeholder` | `string` | Input placeholder |
| `label` | `string` | Label for the filter |
| `className` | `string` | Additional CSS classes |

### DataTableFiltersToolbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `table` | `Table<TData>` | - | TanStack table instance |
| `filters` | `FilterConfig[]` | - | Array of filter configurations |
| `showClearButton` | `boolean` | `true` | Show clear filters button |

## Styling

The filter components use Tailwind CSS classes and follow the existing ObjectQL UI design system. The filters are responsive and will adjust their layout based on screen size:

- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns

## Notes

- Filters work with TanStack Table's built-in filtering capabilities
- All filters use client-side filtering by default
- The `Column` import is used internally but not required in your code
- Filter values are case-insensitive by default (TanStack Table default behavior)
