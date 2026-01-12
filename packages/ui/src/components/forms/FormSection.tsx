import * as React from "react"
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export interface FormSectionProps {
  /** Section title */
  title: string
  /** Section description (optional) */
  description?: string
  /** Icon to display next to title (optional) */
  icon?: LucideIcon
  /** Whether the section is collapsible */
  collapsible?: boolean
  /** Whether the section is initially collapsed (only applies if collapsible is true) */
  defaultCollapsed?: boolean
  /** Layout: 1-column or 2-column */
  columns?: 1 | 2
  /** Child form fields */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * FormSection - A grouping container for form fields
 * 
 * Provides a way to organize form fields into logical sections with optional:
 * - Collapsible behavior
 * - Icons in headers
 * - 1-column or 2-column layouts
 * - Section descriptions
 */
export function FormSection({
  title,
  description,
  icon: Icon,
  collapsible = false,
  defaultCollapsed = false,
  columns = 2,
  children,
  className,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed)

  const headerContent = (
    <div className="flex items-start gap-3 w-full">
      {Icon && (
        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
      )}
      <div className="flex-1">
        <h3 className="text-base font-semibold leading-none tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">
            {description}
          </p>
        )}
      </div>
      {collapsible && (
        <div className="text-muted-foreground">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  )

  const contentGrid = (
    <div
      className={cn(
        "grid gap-4 pt-4",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}
    >
      {children}
    </div>
  )

  if (collapsible) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn("space-y-2 border rounded-lg p-4", className)}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left hover:opacity-80 transition-opacity"
          >
            {headerContent}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {contentGrid}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className={cn("space-y-4 border rounded-lg p-4", className)}>
      <div className="pb-2 border-b">
        {headerContent}
      </div>
      {contentGrid}
    </div>
  )
}
