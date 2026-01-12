import * as React from "react"
import { AgGridReact } from "ag-grid-react"
import type { 
  ColDef, 
  GridReadyEvent, 
  CellClickedEvent,
  GridApi,
  ICellRendererParams
} from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import { format } from "date-fns"
import { 
  CheckCircle2Icon,
  XCircleIcon,
  CalendarIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

// Import types from @objectql/types
import type { ObjectConfig, FieldConfig, FieldType } from '@objectql/types'

/**
 * Extended ColDef with custom properties for field metadata
 */
export interface ExtendedColDef extends ColDef {
  fieldType?: FieldType
  fieldOptions?: any[]
}

/**
 * Props for ObjectGridTable component
 */
export interface ObjectGridTableProps {
  /** Object metadata configuration */
  objectConfig: ObjectConfig
  /** Row data to display */
  data: any[]
  /** Height of the grid */
  height?: string | number
  /** Enable pagination */
  pagination?: boolean
  /** Page size */
  pageSize?: number
  /** Enable row selection */
  rowSelection?: boolean | 'single' | 'multiple'
  /** Callback when grid is ready */
  onGridReady?: (params: GridReadyEvent) => void
  /** Callback when cell is clicked */
  onCellClicked?: (event: CellClickedEvent) => void
  /** Callback when row is selected */
  onSelectionChanged?: (selectedRows: any[]) => void
  /** Additional column definitions to merge */
  additionalColumns?: ColDef[]
}

/**
 * Cell renderer for boolean fields
 */
const BooleanCellRenderer = (props: ICellRendererParams) => {
  const value = props.value
  
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }
  
  return (
    <div className="flex items-center h-full">
      {value ? (
        <CheckCircle2Icon className="w-4 h-4 text-green-500 dark:text-green-400" />
      ) : (
        <XCircleIcon className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  )
}

/**
 * Cell renderer for date/datetime fields
 */
const DateCellRenderer = (props: ICellRendererParams) => {
  const { value, colDef } = props
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  
  try {
    const date = value instanceof Date ? value : new Date(value)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return <span className="text-muted-foreground">{String(value)}</span>
    }
    
    // Format based on field type from colDef
    const extendedColDef = colDef as ExtendedColDef
    const fieldType = extendedColDef.fieldType
    
    if (fieldType === 'datetime') {
      return (
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
          <span>{format(date, "PPp")}</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="w-3 h-3 text-muted-foreground" />
        <span>{format(date, "PP")}</span>
      </div>
    )
  } catch (e) {
    return <span className="text-muted-foreground">{String(value)}</span>
  }
}

/**
 * Cell renderer for number fields (including currency and percent)
 */
const NumberCellRenderer = (props: ICellRendererParams) => {
  const { value, colDef } = props
  
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }
  
  const extendedColDef = colDef as ExtendedColDef
  const fieldType = extendedColDef.fieldType
  const num = Number(value)
  
  if (isNaN(num)) {
    return <span>{String(value)}</span>
  }
  
  let formatted = num.toLocaleString()
  
  if (fieldType === 'currency') {
    // Use Intl.NumberFormat for better currency support
    // TODO: Future enhancement - add currency and locale to FieldConfig
    // For now, default to USD. To support other currencies, extend FieldConfig with:
    // - currency: string (e.g., 'USD', 'EUR', 'CNY')
    // - locale: string (e.g., 'en-US', 'zh-CN')
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  } else if (fieldType === 'percent') {
    formatted = `${num.toFixed(2)}%`
  }
  
  return <span className="tabular-nums">{formatted}</span>
}

/**
 * Cell renderer for select fields with options
 */
const SelectCellRenderer = (props: ICellRendererParams) => {
  const { value, colDef } = props
  const extendedColDef = colDef as ExtendedColDef
  const options = extendedColDef.fieldOptions || []
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  
  // Find the label for the value
  const option = options.find((opt: any) => {
    const optValue = typeof opt === 'string' ? opt : opt.value
    return optValue === value
  })
  
  const label = option 
    ? (typeof option === 'string' ? option : option.label) 
    : String(value)
  
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {label}
    </Badge>
  )
}

/**
 * Cell renderer for lookup/relationship fields
 */
const LookupCellRenderer = (props: ICellRendererParams) => {
  const { value } = props
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  
  // If value is an object with _id and name/label
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const displayValue = value.name || value.label || value.title || value._id
    return <span>{displayValue}</span>
  }
  
  return <span>{String(value)}</span>
}

/**
 * Sanitize email to prevent XSS attacks
 */
const sanitizeEmail = (email: string): string => {
  // Remove any potential JavaScript protocol injection
  const sanitized = String(email).trim();
  // Basic validation - must contain @ and not start with javascript:
  if (!sanitized.includes('@') || sanitized.toLowerCase().startsWith('javascript:')) {
    return '';
  }
  return sanitized;
}

/**
 * Sanitize URL to prevent XSS attacks
 */
const sanitizeUrl = (url: string): string => {
  const sanitized = String(url).trim();
  // Only allow http and https protocols
  if (!sanitized.match(/^https?:\/\//i)) {
    return '';
  }
  // Prevent javascript: protocol and other dangerous protocols
  if (sanitized.toLowerCase().match(/^(javascript|data|vbscript):/)) {
    return '';
  }
  return sanitized;
}

/**
 * Cell renderer for email fields
 */
const EmailCellRenderer = (props: ICellRendererParams) => {
  const { value } = props
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  
  const sanitizedEmail = sanitizeEmail(value);
  
  if (!sanitizedEmail) {
    return <span className="text-muted-foreground">{String(value)}</span>
  }
  
  return (
    <a 
      href={`mailto:${sanitizedEmail}`} 
      className="text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {sanitizedEmail}
    </a>
  )
}

/**
 * Cell renderer for URL fields
 */
const UrlCellRenderer = (props: ICellRendererParams) => {
  const { value } = props
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }
  
  const sanitizedUrl = sanitizeUrl(value);
  
  if (!sanitizedUrl) {
    return <span className="text-muted-foreground">{String(value)}</span>
  }
  
  return (
    <a 
      href={sanitizedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  )
}

/**
 * Get the appropriate cell renderer based on field type
 */
function getCellRendererForFieldType(fieldType: FieldType): any {
  switch (fieldType) {
    case 'boolean':
      return BooleanCellRenderer
    
    case 'date':
    case 'datetime':
    case 'time':
      return DateCellRenderer
    
    case 'number':
    case 'currency':
    case 'percent':
      return NumberCellRenderer
    
    case 'select':
      return SelectCellRenderer
    
    case 'lookup':
    case 'master_detail':
      return LookupCellRenderer
    
    case 'email':
      return EmailCellRenderer
    
    case 'url':
      return UrlCellRenderer
    
    // Text-based fields use default renderer
    case 'text':
    case 'textarea':
    case 'markdown':
    case 'html':
    case 'phone':
    case 'password':
    case 'formula':
    case 'summary':
    case 'auto_number':
    default:
      return undefined // Use AG Grid default
  }
}

/**
 * Generate AG Grid column definitions from ObjectQL object metadata
 */
function generateColumnDefs(objectConfig: ObjectConfig): ExtendedColDef[] {
  const columnDefs: ExtendedColDef[] = []
  
  const fields = objectConfig.fields || {}
  
  Object.entries(fields).forEach(([fieldName, fieldConfig]: [string, FieldConfig]) => {
    // Skip hidden fields
    if (fieldConfig.hidden) {
      return
    }
    
    const colDef: ExtendedColDef = {
      field: fieldName,
      headerName: fieldConfig.label || fieldName,
      sortable: true,
      filter: true,
      resizable: true,
      // Store field type and options for cell renderers
      fieldType: fieldConfig.type,
      fieldOptions: fieldConfig.options,
    }
    
    // Set appropriate cell renderer based on field type
    const cellRenderer = getCellRendererForFieldType(fieldConfig.type)
    if (cellRenderer) {
      colDef.cellRenderer = cellRenderer
    }
    
    // Set column width hints based on field type
    if (fieldConfig.type === 'boolean') {
      colDef.width = 80
      colDef.maxWidth = 100
    } else if (fieldConfig.type === 'date' || fieldConfig.type === 'datetime') {
      colDef.minWidth = 150
    } else if (fieldConfig.type === 'number' || fieldConfig.type === 'currency' || fieldConfig.type === 'percent') {
      colDef.minWidth = 100
      colDef.headerClass = 'ag-right-aligned-header'
      colDef.cellClass = 'ag-right-aligned-cell'
    } else if (fieldConfig.type === 'textarea' || fieldConfig.type === 'markdown') {
      colDef.minWidth = 200
      colDef.flex = 2
    } else if (fieldConfig.type === 'select') {
      colDef.minWidth = 120
    } else {
      colDef.minWidth = 120
      colDef.flex = 1
    }
    
    columnDefs.push(colDef)
  })
  
  return columnDefs
}

/**
 * ObjectGridTable - A metadata-driven AG Grid table component
 * 
 * This component automatically generates column definitions and cell renderers
 * based on ObjectQL object metadata (ObjectConfig).
 */
export function ObjectGridTable({
  objectConfig,
  data,
  height = 600,
  pagination = true,
  pageSize = 10,
  rowSelection = false,
  onGridReady,
  onCellClicked,
  onSelectionChanged,
  additionalColumns = [],
}: ObjectGridTableProps) {
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null)
  const gridRef = React.useRef<AgGridReact>(null)

  // Generate column definitions from metadata
  const columnDefs = React.useMemo(() => {
    const generatedCols = generateColumnDefs(objectConfig)
    return [...generatedCols, ...additionalColumns]
  }, [objectConfig, additionalColumns])

  const defaultColDef = React.useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const handleGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api)
    onGridReady?.(params)
  }

  const handleSelectionChanged = React.useCallback(() => {
    if (!gridApi || !onSelectionChanged) return
    const selectedRows = gridApi.getSelectedRows()
    onSelectionChanged(selectedRows)
  }, [gridApi, onSelectionChanged])

  return (
    <div 
      className="ag-theme-alpine dark:ag-theme-alpine-dark overflow-hidden rounded-lg border"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
        onCellClicked={onCellClicked}
        onSelectionChanged={handleSelectionChanged}
        rowSelection={rowSelection === true ? 'multiple' : rowSelection || undefined}
        suppressRowClickSelection={true}
        animateRows={true}
        pagination={pagination}
        paginationPageSize={pageSize}
        getRowId={(params) => params.data._id || params.data.id}
      />
    </div>
  )
}
