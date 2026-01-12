# Integration Guide: ObjectGridTable in ObjectOS

This guide shows how to integrate the new `ObjectGridTable` component into your ObjectOS application.

## Quick Migration from ObjectListView

### Before (Old ObjectListView)

The old `ObjectListView` component manually handled table rendering with basic HTML tables:

```tsx
// apps/web/src/components/dashboard/ObjectListView.tsx
<Table>
  <TableHeader>
    <TableRow>
      {columns.map(col => (
        <TableHead key={col}>{getFieldLabel(col)}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row, i) => (
      <TableRow key={i}>
        {columns.map(col => (
          <TableCell key={col}>
            {typeof row[col] === 'object' 
              ? JSON.stringify(row[col]) 
              : String(row[col])}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Problems:**
- No type-specific rendering (all fields shown as strings)
- No advanced table features (sorting, filtering, pagination)
- Manual column management
- Poor performance with large datasets

### After (With ObjectGridTable)

Use the new `EnhancedObjectListView`:

```tsx
import { EnhancedObjectListView } from '@/components/dashboard/EnhancedObjectListView';

// In your route/page component
<EnhancedObjectListView 
  objectName="user" 
  user={currentUser} 
/>
```

**Benefits:**
- ✅ Automatic field type recognition
- ✅ Proper rendering for booleans, dates, numbers, etc.
- ✅ Built-in sorting, filtering, pagination
- ✅ Row selection
- ✅ Virtual scrolling for performance
- ✅ Professional AG Grid UI

## Manual Integration

If you want to use `ObjectGridTable` directly in your components:

### Step 1: Fetch Object Metadata

```tsx
import { ObjectGridTable } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

function MyObjectList() {
  const [config, setConfig] = useState<ObjectConfig | null>(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch metadata from your API
    fetch('/api/metadata/object/user')
      .then(res => res.json())
      .then(setConfig);

    // Fetch data
    fetch('/api/data/user')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!config) return <div>Loading...</div>;

  return (
    <ObjectGridTable
      objectConfig={config}
      data={data}
      height={600}
      pagination={true}
      pageSize={20}
    />
  );
}
```

### Step 2: Add Row Actions (Optional)

```tsx
import type { ColDef } from 'ag-grid-community';
import { Button } from '@objectos/ui';

const actionColumn: ColDef = {
  field: 'actions',
  headerName: '',
  width: 100,
  pinned: 'right',
  cellRenderer: (params: any) => (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => handleEdit(params.data)}
      >
        Edit
      </Button>
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => handleDelete(params.data)}
      >
        Delete
      </Button>
    </div>
  ),
};

<ObjectGridTable
  objectConfig={config}
  data={data}
  additionalColumns={[actionColumn]}
/>
```

### Step 3: Handle Row Selection

```tsx
function MyObjectListWithSelection() {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('Please select rows to delete');
      return;
    }
    // Delete logic here
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          {selectedRows.length > 0 && (
            <span>{selectedRows.length} rows selected</span>
          )}
        </div>
        <Button 
          onClick={handleDelete}
          disabled={selectedRows.length === 0}
          variant="destructive"
        >
          Delete Selected
        </Button>
      </div>

      <ObjectGridTable
        objectConfig={config}
        data={data}
        rowSelection="multiple"
        onSelectionChanged={setSelectedRows}
      />
    </>
  );
}
```

## Using with ObjectOS Kernel

If you have access to the kernel instance:

```tsx
import { useContext } from 'react';
import { KernelContext } from '@/context/KernelContext';

function ObjectListWithKernel({ objectName }: { objectName: string }) {
  const kernel = useContext(KernelContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    kernel.find(objectName, {})
      .then(setData)
      .catch(console.error);
  }, [objectName]);

  const objectConfig = kernel.getObject(objectName);

  return (
    <ObjectGridTable
      objectConfig={objectConfig}
      data={data}
    />
  );
}
```

## Supported Field Types

The component automatically recognizes and renders these field types:

| Field Type | Rendering |
|------------|-----------|
| `text`, `textarea` | Plain text |
| `boolean` | ✓/✗ icons |
| `date` | Formatted date with icon |
| `datetime` | Formatted date + time with icon |
| `number` | Right-aligned, comma-separated |
| `currency` | Dollar sign + 2 decimals |
| `percent` | Percentage with % sign |
| `select` | Badge with option label |
| `lookup` | Related object name |
| `email` | Clickable mailto link |
| `url` | Clickable external link |

## Customizing Cell Renderers

You can override the default cell renderer for specific fields:

```tsx
import type { ColDef } from 'ag-grid-community';

const customColumns: ColDef[] = [
  {
    field: 'status',
    cellRenderer: (params: any) => {
      const status = params.value;
      const colorMap = {
        active: 'bg-green-500',
        inactive: 'bg-red-500',
        pending: 'bg-yellow-500',
      };
      return (
        <span className={`px-2 py-1 rounded ${colorMap[status]}`}>
          {status}
        </span>
      );
    },
  },
];

<ObjectGridTable
  objectConfig={config}
  data={data}
  additionalColumns={customColumns}
/>
```

## Performance Considerations

- **Virtual Scrolling**: Only visible rows are rendered
- **Pagination**: Enable for better UX with large datasets
- **Memoization**: Column definitions are automatically memoized
- **Lazy Loading**: Consider implementing server-side pagination for very large datasets

## Best Practices

1. **Always provide object metadata**: The component relies on `ObjectConfig` for field type detection
2. **Set appropriate page sizes**: Default is 10, but adjust based on your use case
3. **Use row selection wisely**: Enable only when needed (batch operations, etc.)
4. **Add loading states**: Show spinners while fetching metadata and data
5. **Error handling**: Wrap in error boundaries for production
6. **Hidden fields**: Mark system fields as `hidden: true` in your object config

## Migration Checklist

When migrating from old table components:

- [ ] Install/update `@objectos/ui` package
- [ ] Ensure `@objectql/types` is available
- [ ] Update API endpoints to return proper `ObjectConfig`
- [ ] Replace old table components with `ObjectGridTable`
- [ ] Test all field types render correctly
- [ ] Add any custom actions/columns needed
- [ ] Verify pagination, sorting, and filtering work
- [ ] Test with production data

## Troubleshooting

### Column not showing
- Check if field is marked as `hidden: true` in ObjectConfig
- Verify field name matches data property name

### Wrong cell renderer
- Ensure field `type` is set correctly in ObjectConfig
- Check if custom renderer is overriding default

### Data not loading
- Verify API endpoint returns correct format
- Check browser console for errors
- Ensure `_id` or `id` field exists for row identification

## Support

For more details, see:
- [ObjectGridTable Documentation](../packages/ui/OBJECT_GRID_TABLE.md)
- [AG Grid Documentation](https://www.ag-grid.com/react-data-grid/)
- [ObjectQL Types Reference](https://github.com/objectql/objectql)
