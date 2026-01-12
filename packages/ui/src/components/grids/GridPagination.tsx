import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

/**
 * Props for GridPagination component
 */
export interface GridPaginationProps {
  /** Current page (0-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Current page size */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void
  /** Whether pagination is disabled */
  disabled?: boolean
}

/**
 * GridPagination - Enhanced pagination controls
 * 
 * Features:
 * - Page size selector
 * - Jump to page
 * - Total count display
 * - First/Last page navigation
 */
export function GridPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: GridPaginationProps) {
  const [jumpToPage, setJumpToPage] = React.useState("")

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10)
    onPageSizeChange(newPageSize)
  }

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert to 0-indexed
    const pageNum = parseInt(jumpToPage, 10) - 1
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages) {
      onPageChange(pageNum)
      setJumpToPage("")
    }
  }

  const handleFirstPage = () => {
    onPageChange(0)
  }

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1)
    }
  }

  const handleLastPage = () => {
    onPageChange(totalPages - 1)
  }

  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems)

  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === totalPages - 1 || totalPages === 0

  return (
    <div className="flex items-center justify-between px-2 py-2 border-t">
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        {/* Total count display */}
        <div>
          Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
          <span className="font-medium text-foreground">{endItem}</span> of{" "}
          <span className="font-medium text-foreground">{totalItems}</span> items
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Items per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Jump to page */}
        <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Go to page:
          </span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            className="h-8 w-16"
            placeholder={(currentPage + 1).toString()}
            disabled={disabled || totalPages === 0}
          />
        </form>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstPage}
              disabled={disabled || isFirstPage}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeftIcon className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={disabled || isFirstPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={disabled || isLastPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastPage}
              disabled={disabled || isLastPage}
              className="h-8 w-8 p-0"
            >
              <ChevronsRightIcon className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
