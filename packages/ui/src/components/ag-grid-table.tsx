import * as React from "react"
import { AgGridReact } from "ag-grid-react"
import type { 
  ColDef, 
  GridReadyEvent, 
  CellClickedEvent,
  RowDragEndEvent,
  GridApi
} from "ag-grid-community"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  LoaderIcon,
  MoreVerticalIcon,
  PlusIcon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// Custom cell renderer for checkbox selection
const CheckboxRenderer = (props: any) => {
  const onChange = (checked: boolean) => {
    props.node.setSelected(checked)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Checkbox
        checked={props.node.isSelected()}
        onCheckedChange={onChange}
        aria-label="Select row"
      />
    </div>
  )
}

// Header checkbox renderer for select all
const HeaderCheckboxRenderer = (props: any) => {
  const [checked, setChecked] = React.useState(false)
  const [indeterminate, setIndeterminate] = React.useState(false)
  const apiRef = React.useRef(props.api)

  React.useEffect(() => {
    const api = apiRef.current
    if (!api) return
    
    const updateCheckboxState = () => {
      const selectedCount = api.getSelectedNodes().length
      const totalCount = api.getDisplayedRowCount()
      setChecked(selectedCount === totalCount && totalCount > 0)
      setIndeterminate(selectedCount > 0 && selectedCount < totalCount)
    }

    api.addEventListener('selectionChanged', updateCheckboxState)
    return () => {
      // Clean up using the stored API reference to prevent memory leaks
      api.removeEventListener('selectionChanged', updateCheckboxState)
    }
  }, [])

  const onChange = (value: boolean) => {
    if (value) {
      apiRef.current.selectAll()
    } else {
      apiRef.current.deselectAll()
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Checkbox
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={onChange}
        aria-label="Select all"
      />
    </div>
  )
}

// Drag handle renderer
const DragHandleRenderer = () => {
  return (
    <div className="flex items-center justify-center h-full cursor-move">
      <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 10 16" fill="currentColor">
        <path d="M4 14c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM2 6C.9 6 0 6.9 0 8s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6C.9 0 0 .9 0 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    </div>
  )
}

// Header cell renderer
const HeaderCellRenderer = (props: any) => {
  return (
    <Button 
      variant="link" 
      className="w-fit px-0 text-left text-foreground"
      onClick={() => {
        // This will be handled by row click event
      }}
    >
      {props.value}
    </Button>
  )
}

// Status cell renderer
const StatusRenderer = (props: any) => {
  const status = props.value
  return (
    <Badge
      variant="outline"
      className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
    >
      {status === "Done" ? (
        <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
      ) : (
        <LoaderIcon />
      )}
      {status}
    </Badge>
  )
}

// Type cell renderer
const TypeRenderer = (props: any) => {
  return (
    <div className="w-32">
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {props.value}
      </Badge>
    </div>
  )
}

// Editable input cell renderer
const EditableInputRenderer = (props: any) => {
  const [value, setValue] = React.useState(props.value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Saving ${props.data.header}`,
      success: "Done",
      error: "Error",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex items-center">
      <Input
        ref={inputRef}
        className="h-8 w-16 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  )
}

// Reviewer cell renderer
const ReviewerRenderer = (props: any) => {
  const isAssigned = props.value !== "Assign reviewer"

  if (isAssigned) {
    return <span>{props.value}</span>
  }

  return (
    <Select>
      <SelectTrigger className="h-8 w-40">
        <SelectValue placeholder="Assign reviewer" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
        <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
      </SelectContent>
    </Select>
  )
}

// Actions cell renderer
const ActionsRenderer = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
          size="icon"
        >
          <MoreVerticalIcon />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AgGridTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<z.infer<typeof schema> | null>(null)
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(0)
  const gridRef = React.useRef<AgGridReact>(null)

  const columnDefs: ColDef[] = React.useMemo(() => [
    {
      field: 'drag',
      headerName: '',
      width: 50,
      rowDrag: true,
      cellRenderer: DragHandleRenderer,
      suppressMenu: true,
      sortable: false,
      filter: false,
    },
    {
      field: 'select',
      headerName: '',
      width: 50,
      checkboxSelection: false,
      headerComponent: HeaderCheckboxRenderer,
      cellRenderer: CheckboxRenderer,
      suppressMenu: true,
      sortable: false,
      filter: false,
    },
    {
      field: 'header',
      headerName: 'Header',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      cellRenderer: HeaderCellRenderer,
    },
    {
      field: 'type',
      headerName: 'Section Type',
      width: 150,
      sortable: true,
      filter: true,
      cellRenderer: TypeRenderer,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: true,
      filter: true,
      cellRenderer: StatusRenderer,
    },
    {
      field: 'target',
      headerName: 'Target',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: EditableInputRenderer,
      headerClass: 'text-right',
    },
    {
      field: 'limit',
      headerName: 'Limit',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: EditableInputRenderer,
      headerClass: 'text-right',
    },
    {
      field: 'reviewer',
      headerName: 'Reviewer',
      width: 180,
      sortable: true,
      filter: true,
      cellRenderer: ReviewerRenderer,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      cellRenderer: ActionsRenderer,
      suppressMenu: true,
      sortable: false,
      filter: false,
    },
  ], [])

  const defaultColDef = React.useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api)
  }

  const onRowDragEnd = (event: RowDragEndEvent) => {
    const movingNode = event.node
    const overNode = event.overNode
    
    if (!movingNode || !overNode) return
    
    const movingData = movingNode.data
    const overData = overNode.data
    
    const fromIndex = data.findIndex(d => d.id === movingData.id)
    const toIndex = data.findIndex(d => d.id === overData.id)
    
    if (fromIndex !== toIndex) {
      const newData = [...data]
      const [movedItem] = newData.splice(fromIndex, 1)
      newData.splice(toIndex, 0, movedItem)
      setData(newData)
    }
  }

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === 'header') {
      setSelectedItem(event.data)
    }
  }

  const getSelectedRowsCount = () => {
    return gridApi?.getSelectedNodes().length || 0
  }

  const getTotalRowsCount = () => {
    return gridApi?.getDisplayedRowCount() || 0
  }

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value)
    setPageSize(newPageSize)
    // AG Grid v35 uses updateGridOptions instead of the deprecated paginationSetPageSize
    if (gridRef.current?.api) {
      gridRef.current.api.updateGridOptions({ paginationPageSize: newPageSize })
    }
  }

  const handleFirstPage = () => {
    gridApi?.paginationGoToFirstPage()
    setCurrentPage(0)
  }

  const handlePreviousPage = () => {
    gridApi?.paginationGoToPreviousPage()
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    gridApi?.paginationGoToNextPage()
    setCurrentPage((prev) => prev + 1)
  }

  const handleLastPage = () => {
    const lastPage = Math.ceil(getTotalRowsCount() / pageSize) - 1
    gridApi?.paginationGoToPage(lastPage)
    setCurrentPage(lastPage)
  }

  const toggleColumnVisibility = (field: string, visible: boolean) => {
    gridApi?.setColumnsVisible([field], visible)
  }

  const isColumnVisible = (field: string) => {
    const column = gridApi?.getColumn(field)
    return column?.isVisible() ?? true
  }

  const totalPages = Math.ceil(getTotalRowsCount() / pageSize)

  return (
    <Tabs
      defaultValue="outline"
      className="flex w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="@4xl/main:hidden flex w-fit"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance" className="gap-1">
            Past Performance{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel" className="gap-1">
            Key Personnel{" "}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              2
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {columnDefs
                .filter((col) => col.field && !['drag', 'select', 'actions'].includes(col.field))
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.field}
                    className="capitalize"
                    checked={isColumnVisible(column.field!)}
                    onCheckedChange={(value) =>
                      toggleColumnVisibility(column.field!, !!value)
                    }
                  >
                    {column.headerName}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <PlusIcon />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border ag-theme-alpine dark:ag-theme-alpine-dark">
          <div style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={data}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onRowDragEnd={onRowDragEnd}
              onCellClicked={onCellClicked}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              animateRows={true}
              pagination={true}
              paginationPageSize={pageSize}
              suppressPaginationPanel={true}
              rowDragManaged={true}
              getRowId={(params) => params.data.id.toString()}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {getSelectedRowsCount()} of {getTotalRowsCount()} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={handleFirstPage}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={handleLastPage}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>

      {selectedItem && (
        <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <SheetContent side="right" className="flex flex-col">
            <SheetHeader className="gap-1">
              <SheetTitle>{selectedItem.header}</SheetTitle>
              <SheetDescription>
                Edit section details
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
              <form className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="header">Header</Label>
                  <Input id="header" defaultValue={selectedItem.header} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="type">Type</Label>
                    <Select defaultValue={selectedItem.type}>
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Table of Contents">Table of Contents</SelectItem>
                        <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                        <SelectItem value="Technical Approach">Technical Approach</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Capabilities">Capabilities</SelectItem>
                        <SelectItem value="Focus Documents">Focus Documents</SelectItem>
                        <SelectItem value="Narrative">Narrative</SelectItem>
                        <SelectItem value="Cover Page">Cover Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={selectedItem.status}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="target">Target</Label>
                    <Input id="target" defaultValue={selectedItem.target} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="limit">Limit</Label>
                    <Input id="limit" defaultValue={selectedItem.limit} />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="reviewer">Reviewer</Label>
                  <Select defaultValue={selectedItem.reviewer}>
                    <SelectTrigger id="reviewer" className="w-full">
                      <SelectValue placeholder="Select a reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                      <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
                      <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </div>
            <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
              <Button className="w-full">Submit</Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Done
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </Tabs>
  )
}
