# Enhanced Object Grid Components

This document provides comprehensive documentation for the Enhanced Object Grid components built with AG Grid.

## Table of Contents

- [AdvancedDataGrid](#advanceddatagrid)
- [GridColumnManager](#gridcolumnmanager)
- [GridPagination](#gridpagination)
- [GridToolbar](#gridtoolbar)
- [Complete Example](#complete-example)

---

## AdvancedDataGrid

A production-ready AG Grid component with metadata-driven column generation and advanced features.

### Features

- **Column Management**: Resizing, reordering, and pinning
- **Row Selection**: Single, multiple, and checkbox selection
- **Inline Editing**: Direct cell editing with validation support
- **Virtual Scrolling**: Optimized for 100k+ rows
- **Export**: CSV/Excel export capabilities
- **Keyboard Navigation**: Full keyboard support
- **Type-Aware Rendering**: Automatic cell renderers based on field types

### Props

```typescript
interface AdvancedDataGridProps {
  objectConfig: ObjectConfig          // Object metadata configuration
  data: any[]                         // Row data to display
  height?: string | number            // Grid height (default: 600)
  pagination?: boolean                // Enable pagination (default: true)
  pageSize?: number                   // Page size (default: 10)
  rowSelection?: 'single' | 'multiple' | false  // Row selection mode
  editable?: boolean                  // Enable inline editing
  enableColumnResizing?: boolean      // Enable column resizing (default: true)
  enableColumnReordering?: boolean    // Enable column reordering (default: true)
  enableColumnPinning?: boolean       // Enable column pinning (default: true)
  enableContextMenu?: boolean         // Enable context menu (default: true)
  enableCsvExport?: boolean           // Enable CSV export (default: true)
  enableExcelExport?: boolean         // Enable Excel export (default: false)
  onGridReady?: (params: GridReadyEvent) => void
  onCellClicked?: (event: CellClickedEvent) => void
  onSelectionChanged?: (selectedRows: any[]) => void
  onCellEditRequest?: (event: CellEditRequestEvent) => void
  additionalColumns?: ColDef[]        // Additional column definitions
  customColumnDefs?: ColDef[]         // Override auto-generated columns
}
```

### Basic Usage

```tsx
import { AdvancedDataGrid } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

const userConfig: ObjectConfig = {
  name: 'user',
  label: 'Users',
  fields: {
    name: { type: 'text', label: 'Name', required: true },
    email: { type: 'email', label: 'Email', required: true },
    is_active: { type: 'boolean', label: 'Active' },
    created_at: { type: 'datetime', label: 'Created' },
  },
};

const users = [
  { _id: '1', name: 'John Doe', email: 'john@example.com', is_active: true, created_at: new Date() },
  // ... more users
];

function UserGrid() {
  return (
    <AdvancedDataGrid
      objectConfig={userConfig}
      data={users}
      height={600}
      rowSelection="multiple"
      editable={true}
      onSelectionChanged={(rows) => console.log('Selected:', rows)}
    />
  );
}
```

### With Editing

```tsx
function EditableGrid() {
  const handleCellEditRequest = (event: CellEditRequestEvent) => {
    const { data, colDef, newValue } = event;
    // Validate and update data
    console.log(`Updating ${colDef.field} to ${newValue} for row ${data._id}`);
  };

  return (
    <AdvancedDataGrid
      objectConfig={userConfig}
      data={users}
      editable={true}
      onCellEditRequest={handleCellEditRequest}
    />
  );
}
```

### Field Type Support

The grid automatically applies appropriate renderers based on field types:

- **boolean**: Checkmark/X icon
- **date/datetime**: Formatted date with calendar icon
- **number/currency/percent**: Formatted numbers with proper alignment
- **select**: Badge display with option labels
- **lookup**: Relationship display
- **email**: Clickable mailto link
- **url**: Clickable external link

---

## GridColumnManager

A column visibility and configuration manager with drag & drop reordering.

### Features

- Show/hide columns
- Drag & drop column reordering
- Save column preferences
- Bulk show/hide all

### Props

```typescript
interface GridColumnManagerProps {
  columns: ColumnConfig[]             // List of column configurations
  onColumnsChange: (columns: ColumnConfig[]) => void
  onSavePreferences?: (columns: ColumnConfig[]) => void
  showSaveButton?: boolean            // Show save button (default: true)
}

interface ColumnConfig {
  id: string                          // Unique column identifier
  label: string                       // Display name
  visible: boolean                    // Whether the column is visible
  hideable?: boolean                  // Whether can be hidden (default: true)
}
```

### Usage

```tsx
import { GridColumnManager, type ColumnConfig } from '@objectos/ui';

function MyGrid() {
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'age', label: 'Age', visible: false },
    { id: 'status', label: 'Status', visible: true, hideable: false },
  ]);

  const handleSavePreferences = (cols: ColumnConfig[]) => {
    localStorage.setItem('grid-columns', JSON.stringify(cols));
  };

  return (
    <GridColumnManager
      columns={columns}
      onColumnsChange={setColumns}
      onSavePreferences={handleSavePreferences}
    />
  );
}
```

---

## GridPagination

Enhanced pagination controls with page size selector and jump-to-page.

### Features

- Page size selector
- Jump to specific page
- Total count display
- First/Previous/Next/Last navigation

### Props

```typescript
interface GridPaginationProps {
  currentPage: number                 // Current page (0-indexed)
  totalPages: number                  // Total number of pages
  pageSize: number                    // Current page size
  totalItems: number                  // Total number of items
  pageSizeOptions?: number[]          // Available page sizes (default: [10, 20, 50, 100])
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean                  // Disable pagination
}
```

### Usage

```tsx
import { GridPagination } from '@objectos/ui';

function PaginatedList() {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const totalItems = 500;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <>
      {/* Your data display */}
      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
```

---

## GridToolbar

Action bar for grid operations with search, filters, bulk actions, and view switching.

### Features

- Search input
- Filter toggle
- Bulk actions
- View mode switcher
- Export menu
- Custom actions

### Props

```typescript
interface GridToolbarProps {
  selectedCount?: number              // Number of selected items
  totalCount?: number                 // Total number of items
  viewMode?: ViewMode                 // Current view mode
  availableViews?: ViewMode[]         // Available view modes
  enableSearch?: boolean              // Enable search (default: true)
  enableFilter?: boolean              // Enable filter (default: true)
  enableExport?: boolean              // Enable export (default: true)
  enableBulkActions?: boolean         // Enable bulk actions (default: true)
  searchValue?: string                // Search value
  filterActive?: boolean              // Filter active state
  onSearchChange?: (value: string) => void
  onFilterToggle?: () => void
  onViewModeChange?: (mode: ViewMode) => void
  onExportCsv?: () => void
  onExportExcel?: () => void
  onBulkDelete?: () => void
  customBulkActions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
  customActions?: React.ReactNode
}

type ViewMode = 'grid' | 'list' | 'kanban' | 'calendar'
```

### Usage

```tsx
import { GridToolbar } from '@objectos/ui';

function MyDataView() {
  const [searchValue, setSearchValue] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const handleExportCsv = () => {
    // Export logic
  };

  const handleBulkDelete = () => {
    // Bulk delete logic
  };

  return (
    <div>
      <GridToolbar
        selectedCount={selectedCount}
        totalCount={100}
        searchValue={searchValue}
        filterActive={filterActive}
        onSearchChange={setSearchValue}
        onFilterToggle={() => setFilterActive(!filterActive)}
        onExportCsv={handleExportCsv}
        onBulkDelete={handleBulkDelete}
        customBulkActions={[
          {
            label: 'Mark as Active',
            onClick: () => console.log('Mark as active'),
          },
        ]}
      />
      {/* Your data grid */}
    </div>
  );
}
```

---

## Complete Example

Here's a complete example combining all components:

```tsx
import { useState } from 'react';
import {
  AdvancedDataGrid,
  GridColumnManager,
  GridPagination,
  GridToolbar,
  type ColumnConfig,
} from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

const userConfig: ObjectConfig = {
  name: 'user',
  label: 'Users',
  fields: {
    name: { type: 'text', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    age: { type: 'number', label: 'Age' },
    is_active: { type: 'boolean', label: 'Active' },
    created_at: { type: 'datetime', label: 'Created' },
  },
};

function CompleteDataGridExample() {
  // Data state
  const [data, setData] = useState([
    { _id: '1', name: 'John Doe', email: 'john@example.com', age: 30, is_active: true, created_at: new Date() },
    // ... more data
  ]);

  // Column state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'age', label: 'Age', visible: true },
    { id: 'is_active', label: 'Active', visible: true },
    { id: 'created_at', label: 'Created', visible: false },
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Search & filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  // Computed values
  const filteredData = data.filter(row =>
    searchValue ? row.name.toLowerCase().includes(searchValue.toLowerCase()) : true
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Handlers
  const handleExportCsv = () => {
    console.log('Exporting CSV...');
    // Export logic
  };

  const handleBulkDelete = () => {
    console.log('Deleting:', selectedRows);
    setData(data.filter(row => !selectedRows.includes(row)));
    setSelectedRows([]);
  };

  const handleSavePreferences = (cols: ColumnConfig[]) => {
    localStorage.setItem('user-grid-columns', JSON.stringify(cols));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <GridToolbar
        selectedCount={selectedRows.length}
        totalCount={filteredData.length}
        searchValue={searchValue}
        filterActive={filterActive}
        onSearchChange={setSearchValue}
        onFilterToggle={() => setFilterActive(!filterActive)}
        onExportCsv={handleExportCsv}
        onBulkDelete={handleBulkDelete}
        customActions={
          <GridColumnManager
            columns={columns}
            onColumnsChange={setColumns}
            onSavePreferences={handleSavePreferences}
          />
        }
      />

      {/* Grid */}
      <AdvancedDataGrid
        objectConfig={userConfig}
        data={paginatedData}
        height={600}
        pagination={false} // Using custom pagination
        rowSelection="multiple"
        editable={true}
        onSelectionChanged={setSelectedRows}
      />

      {/* Pagination */}
      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(0); // Reset to first page
        }}
      />
    </div>
  );
}

export default CompleteDataGridExample;
```

---

## Best Practices

### 1. Performance

- Use pagination for large datasets
- Memoize column definitions
- Implement server-side filtering for 10k+ records

### 2. User Experience

- Provide clear feedback for bulk actions
- Save column preferences to localStorage
- Show loading states during data fetching

### 3. Accessibility

- All components are keyboard navigable
- Screen reader support via AG Grid
- Clear aria labels for buttons

### 4. Security

- URL and email sanitization built-in
- XSS protection in cell renderers
- Validate user input in edit handlers

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

Part of the ObjectOS project. See repository license for details.
