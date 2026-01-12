import * as React from "react"
import { useForm, Controller, UseFormReturn, RegisterOptions } from "react-hook-form"
import type { ObjectConfig, FieldConfig } from '@objectql/types'

import { Button } from "@/components/ui/button"
import { Field } from "@/components/fields/Field"
import { cn } from "@/lib/utils"

/**
 * Props for ObjectForm component
 */
export interface ObjectFormProps {
  /** Object metadata configuration */
  objectConfig: ObjectConfig
  /** Initial form values */
  initialValues?: Record<string, any>
  /** Callback when form is submitted with valid data */
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Whether the form is in loading/submitting state */
  isSubmitting?: boolean
  /** Custom submit button text */
  submitText?: string
  /** Custom cancel button text */
  cancelText?: string
  /** Hide cancel button */
  hideCancelButton?: boolean
  /** Additional CSS classes for the form */
  className?: string
  /** Number of columns in the form grid (1 or 2) */
  columns?: 1 | 2
  /** Expose form methods to parent component */
  formRef?: React.MutableRefObject<UseFormReturn<any> | null>
}

/**
 * Determine if a field should span full width
 */
function isFullWidthField(fieldConfig: FieldConfig): boolean {
  // These field types typically need more space
  const fullWidthTypes = ['textarea', 'markdown', 'html', 'grid', 'object']
  return fullWidthTypes.includes(fieldConfig.type)
}

/**
 * Determine if a field should be hidden from the form
 */
function shouldHideField(fieldName: string, fieldConfig: FieldConfig): boolean {
  // Hide explicitly hidden fields
  if (fieldConfig.hidden) {
    return true
  }
  
  // Hide system fields that are auto-managed
  const systemFields = ['_id', 'id', 'created_at', 'updated_at', 'created_by', 'updated_by']
  if (systemFields.includes(fieldName)) {
    return true
  }
  
  // Hide readonly fields with auto values (like auto_number)
  if (fieldConfig.readonly && ['auto_number', 'formula', 'summary'].includes(fieldConfig.type)) {
    return true
  }
  
  return false
}

/**
 * Generate validation rules for react-hook-form based on field config
 */
function getValidationRules(fieldConfig: FieldConfig): RegisterOptions {
  const rules: RegisterOptions = {}
  
  if (fieldConfig.required) {
    rules.required = `${fieldConfig.label || 'This field'} is required`
  }
  
  if (fieldConfig.min !== undefined && ['number', 'currency', 'percent'].includes(fieldConfig.type)) {
    rules.min = {
      value: fieldConfig.min,
      message: `Minimum value is ${fieldConfig.min}`
    }
  }
  
  if (fieldConfig.max !== undefined && ['number', 'currency', 'percent'].includes(fieldConfig.type)) {
    rules.max = {
      value: fieldConfig.max,
      message: `Maximum value is ${fieldConfig.max}`
    }
  }
  
  if (fieldConfig.min_length !== undefined) {
    rules.minLength = {
      value: fieldConfig.min_length,
      message: `Minimum length is ${fieldConfig.min_length} characters`
    }
  }
  
  if (fieldConfig.max_length !== undefined) {
    rules.maxLength = {
      value: fieldConfig.max_length,
      message: `Maximum length is ${fieldConfig.max_length} characters`
    }
  }
  
  if (fieldConfig.regex) {
    rules.pattern = {
      value: new RegExp(fieldConfig.regex),
      message: 'Invalid format'
    }
  }
  
  // Email validation
  if (fieldConfig.type === 'email') {
    rules.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  }
  
  // URL validation
  if (fieldConfig.type === 'url') {
    rules.pattern = {
      // Require http(s) scheme and a plausible hostname, with optional port and path
      value: /^(https?:\/\/)([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/i,
      message: 'Invalid URL (must start with http:// or https://)'
    }
  }
  
  return rules
}

/**
 * ObjectForm - A metadata-driven form component
 * 
 * This component automatically generates form fields based on ObjectQL object metadata (ObjectConfig).
 * It handles validation, field types, and form submission.
 */
export function ObjectForm({
  objectConfig,
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  hideCancelButton = false,
  className,
  columns = 2,
  formRef,
}: ObjectFormProps) {
  const form = useForm({
    defaultValues: initialValues,
  })

  const { control, handleSubmit, reset } = form

  // Expose form methods to parent if formRef is provided
  React.useEffect(() => {
    if (formRef) {
      formRef.current = form
    }
  }, [form, formRef])

  // Reset form when initialValues change
  React.useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const fields = React.useMemo(() => {
    const fieldsConfig = objectConfig.fields || {}
    return Object.entries(fieldsConfig).filter(([fieldName, fieldConfig]) => {
      return !shouldHideField(fieldName, fieldConfig as FieldConfig)
    })
  }, [objectConfig])

  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className={cn(
        "grid gap-4",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {fields.map(([fieldName, fieldConfig]: [string, FieldConfig]) => {
        const isFullWidth = isFullWidthField(fieldConfig)
        const validationRules = getValidationRules(fieldConfig)

        return (
          <Controller
            key={fieldName}
            name={fieldName}
            control={control}
            rules={validationRules}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <div className={cn(
                isFullWidth && columns === 2 && "md:col-span-2"
              )}>
                <Field
                  name={fieldName}
                  label={fieldConfig.label || fieldName}
                  type={fieldConfig.type}
                  value={value}
                  onChange={onChange}
                  error={error?.message}
                  required={fieldConfig.required}
                  description={fieldConfig.description || fieldConfig.help_text}
                  placeholder={fieldConfig.help_text}
                  options={fieldConfig.options}
                  referenceTo={fieldConfig.reference_to}
                  disabled={isSubmitting || fieldConfig.readonly}
                  readOnly={fieldConfig.readonly}
                />
              </div>
            )}
          />
        )
      })}

      <div className={cn(
        "flex justify-end gap-2 pt-4",
        columns === 2 && "md:col-span-2"
      )}>
        {!hideCancelButton && onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  )
}

/**
 * Hook to create a controlled ObjectForm instance
 * Useful when you need to access form methods from parent component
 */
export function useObjectForm(objectConfig: ObjectConfig, initialValues?: Record<string, any>) {
  const formRef = React.useRef<UseFormReturn<any> | null>(null)

  return {
    formRef,
    getValues: () => formRef.current?.getValues(),
    setValue: (name: string, value: any) => formRef.current?.setValue(name, value),
    reset: (values?: Record<string, any>) => formRef.current?.reset(values),
    trigger: (name?: string | string[]) => formRef.current?.trigger(name),
  }
}
