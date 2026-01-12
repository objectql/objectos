# AG Grid Migration Guide

## Overview

We have successfully migrated from TanStack Table to AG Grid (v35.0.0) for the frontend table component. AG Grid provides enterprise-grade features with better performance and more comprehensive functionality out of the box.

## What Changed

### Before (TanStack Table)
- Manual implementation of pagination, sorting, filtering
- Custom drag-and-drop with @dnd-kit libraries
- Limited built-in features
- More boilerplate code required

### After (AG Grid)
- Built-in pagination, sorting, filtering
- Native row dragging and column resizing
- Advanced features like row grouping, aggregation (available in enterprise version)
- Less code, more features

## Features Implemented

### ✅ Core Features

1. **Row Selection**
   - Checkbox-based multi-row selection
   - Header checkbox for select all/deselect all
   - Custom checkbox renderer using our UI components

2. **Sorting**
   - Click column headers to sort
   - Multi-column sorting support
   - Custom sort indicators

3. **Filtering**
   - Built-in column filters
   - Quick filter (search across all columns)
   - Custom filter UI integration

4. **Pagination**
   - Custom pagination controls (hidden AG Grid default)
   - Configurable page sizes (10, 20, 30, 40, 50)
   - First/Previous/Next/Last navigation

5. **Drag and Drop**
   - Row reordering via drag handle
   - Visual feedback during drag
   - Managed by AG Grid internally

6. **Column Management**
   - Column visibility toggle
   - Column resizing
   - Fixed column widths where needed

7. **Custom Cell Renderers**
   - Status badges with icons
   - Editable input cells
   - Dropdown selectors
   - Action menus
   - Clickable links

8. **Theme Integration**
   - Custom CSS theme matching ObjectOS design system
   - Dark mode support via `ag-theme-alpine-dark`
   - Tailwind CSS variable integration

## Usage

### Basic DataTable Component

```tsx
import { DataTable, schema } from '@objectos/ui';
import { z } from 'zod';

const sampleData: z.infer<typeof schema>[] = [
  {
    id: 1,
    header: "Example",
    type: "Type",
    status: "Done",
    target: "10",
    limit: "15",
    reviewer: "John Doe",
  },
  // ... more rows
];

function MyComponent() {
  return <DataTable data={sampleData} />;
}
```

### Custom AG Grid Table

```tsx
import { AgGridTable } from '@objectos/ui';
// Use the same schema and data
```

## File Structure

```
packages/ui/src/
├── components/
│   ├── data-table.tsx          # Main DataTable component (AG Grid)
│   ├── ag-grid-table.tsx       # Alternative export name
│   └── data-table-old.tsx      # Backup of TanStack implementation
├── styles/
│   └── ag-grid-theme.css       # Custom AG Grid theme
└── styles.css                   # Imports AG Grid theme
```

## Theme Customization

The AG Grid theme is customized in `packages/ui/src/styles/ag-grid-theme.css` to match the ObjectOS design system:

```css
.ag-theme-alpine-dark {
  --ag-background-color: hsl(var(--background));
  --ag-foreground-color: hsl(var(--foreground));
  --ag-header-background-color: hsl(var(--muted));
  /* ... more variables */
}
```

## Advanced Features (Available)

AG Grid v35 provides many advanced features that can be enabled:

### 1. Server-Side Row Model
For handling large datasets with server-side pagination, sorting, and filtering.

### 2. Column Grouping
Group related columns together with expandable headers.

### 3. Row Grouping & Aggregation
Group rows by column values and show aggregated data.

### 4. Context Menu
Custom right-click menu for rows and cells.

### 5. Cell Editing
Built-in editors for different data types.

### 6. Export
Export to CSV/Excel (enterprise feature).

## Migration Checklist for Developers

If you're updating a component to use AG Grid:

- [ ] Replace TanStack Table imports with AG Grid imports
- [ ] Convert column definitions to `ColDef[]` format
- [ ] Update cell renderers to AG Grid's `ICellRendererParams` interface
- [ ] Replace `useReactTable` hook with AG Grid's `AgGridReact` component
- [ ] Update event handlers (e.g., `onRowClicked` → `onCellClicked`)
- [ ] Remove @dnd-kit dependencies if only used for table drag-drop
- [ ] Test pagination, sorting, and filtering
- [ ] Verify theme matches design system

## Performance Benefits

1. **Virtual Scrolling**: Only renders visible rows
2. **Efficient Updates**: Smart change detection
3. **Optimized Filtering**: Built-in filter caching
4. **Better Memory Management**: Recycles DOM nodes

## Known Limitations

1. **Bundle Size**: AG Grid adds ~500KB to the bundle (but removes @dnd-kit and TanStack Table)
2. **Learning Curve**: Different API than TanStack Table
3. **Enterprise Features**: Some features require AG Grid Enterprise license

## Resources

- [AG Grid Documentation](https://www.ag-grid.com/react-data-grid/)
- [AG Grid v35 Release Notes](https://www.ag-grid.com/changelog/)
- [Column Properties](https://www.ag-grid.com/react-data-grid/column-properties/)
- [Cell Renderers](https://www.ag-grid.com/react-data-grid/component-cell-renderer/)

## Support

For questions or issues:
1. Check AG Grid docs
2. Review the implementation in `packages/ui/src/components/data-table.tsx`
3. Create an issue in the ObjectOS repository
