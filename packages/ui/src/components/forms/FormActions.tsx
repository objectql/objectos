import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FormActionsProps {
  /** Whether the form is in submitting state */
  isSubmitting?: boolean
  /** Callback for Save button */
  onSave?: () => void
  /** Callback for Save & New button (optional) */
  onSaveAndNew?: () => void
  /** Callback for Cancel button */
  onCancel?: () => void
  /** Text for Save button */
  saveText?: string
  /** Text for Save & New button */
  saveAndNewText?: string
  /** Text for Cancel button */
  cancelText?: string
  /** Hide Save & New button */
  hideSaveAndNew?: boolean
  /** Hide Cancel button */
  hideCancel?: boolean
  /** Show validation errors count */
  errorCount?: number
  /** Additional CSS classes */
  className?: string
  /** Position of the actions (left, center, right) */
  align?: 'left' | 'center' | 'right'
}

/**
 * FormActions - Form action buttons component
 * 
 * Provides consistent form action buttons with:
 * - Save button
 * - Save & New button (optional)
 * - Cancel button
 * - Loading states
 * - Validation feedback
 */
export function FormActions({
  isSubmitting = false,
  onSave,
  onSaveAndNew,
  onCancel,
  saveText = 'Save',
  saveAndNewText = 'Save & New',
  cancelText = 'Cancel',
  hideSaveAndNew = false,
  hideCancel = false,
  errorCount,
  className,
  align = 'right',
}: FormActionsProps) {
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align]

  return (
    <div className={cn("space-y-3", className)}>
      {/* Validation feedback */}
      {errorCount !== undefined && errorCount > 0 && (
        <div className="text-sm text-destructive">
          {errorCount === 1 
            ? "Please fix 1 error before saving"
            : `Please fix ${errorCount} errors before saving`
          }
        </div>
      )}

      {/* Action buttons */}
      <div className={cn("flex gap-2", alignmentClass)}>
        {!hideCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
        )}

        {!hideSaveAndNew && onSaveAndNew && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveAndNew}
            disabled={isSubmitting || (errorCount !== undefined && errorCount > 0)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              saveAndNewText
            )}
          </Button>
        )}

        {onSave && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isSubmitting || (errorCount !== undefined && errorCount > 0)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              saveText
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
