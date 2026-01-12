import * as React from "react"
import { useForm, Controller, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { ObjectConfig, FieldConfig } from '@objectql/types'

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field } from "@/components/fields/Field"
import { FormSection } from "./FormSection"
import { FormActions } from "./FormActions"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

/**
 * Section configuration for DynamicForm
 */
export interface FormSectionConfig {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Section description (optional) */
  description?: string
  /** Icon for the section header */
  icon?: LucideIcon
  /** Field names that belong to this section */
  fields: string[]
  /** Whether this section is collapsible */
  collapsible?: boolean
  /** Whether this section is initially collapsed */
  defaultCollapsed?: boolean
  /** Number of columns for this section */
  columns?: 1 | 2
  /** Condition to show this section */
  visible?: (values: Record<string, any>) => boolean
}

/**
 * Tab configuration for DynamicForm
 */
export interface FormTabConfig {
  /** Tab identifier */
  id: string
  /** Tab label */
  label: string
  /** Sections in this tab */
  sections: FormSectionConfig[]
}

/**
 * Field dependency configuration
 */
export interface FieldDependency {
  /** Source field that this field depends on */
  dependsOn: string
  /** Condition to show this field based on source field value */
  condition: (sourceValue: any, allValues: Record<string, any>) => boolean
}

/**
 * Props for DynamicForm component
 */
export interface DynamicFormProps {
  /** Object metadata configuration */
  objectConfig: ObjectConfig
  /** Initial form values */
  initialValues?: Record<string, any>
  /** Callback when form is submitted with valid data */
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Callback for Save & New action */
  onSaveAndNew?: (data: Record<string, any>) => void | Promise<void>
  /** Whether the form is in loading/submitting state */
  isSubmitting?: boolean
  /** Custom submit button text */
  submitText?: string
  /** Custom Save & New button text */
  saveAndNewText?: string
  /** Custom cancel button text */
  cancelText?: string
  /** Hide Save & New button */
  hideSaveAndNew?: boolean
  /** Hide cancel button */
  hideCancelButton?: boolean
  /** Additional CSS classes for the form */
  className?: string
  /** Number of columns in the form grid (1 or 2) - used when no sections/tabs defined */
  columns?: 1 | 2
  /** Section configurations (optional, for organized layouts) */
  sections?: FormSectionConfig[]
  /** Tab configurations (optional, for tabbed layouts) */
  tabs?: FormTabConfig[]
  /** Field dependencies for conditional visibility */
  fieldDependencies?: Record<string, FieldDependency>
  /** Expose form methods to parent component */
  formRef?: React.MutableRefObject<UseFormReturn<any> | null>
  /** Enable real-time validation */
  realtimeValidation?: boolean
}

/**
 * Determine if a field should span full width
 */
function isFullWidthField(fieldConfig: FieldConfig): boolean {
  const fullWidthTypes = ['textarea', 'markdown', 'html', 'grid', 'object']
  return fullWidthTypes.includes(fieldConfig.type)
}

/**
 * Determine if a field should be hidden from the form
 */
function shouldHideField(fieldName: string, fieldConfig: FieldConfig): boolean {
  if (fieldConfig.hidden) {
    return true
  }
  
  const systemFields = ['_id', 'id', 'created_at', 'updated_at', 'created_by', 'updated_by']
  if (systemFields.includes(fieldName)) {
    return true
  }
  
  if (fieldConfig.readonly && ['auto_number', 'formula', 'summary'].includes(fieldConfig.type)) {
    return true
  }
  
  return false
}

/**
 * Build Zod schema from ObjectConfig for validation
 */
function buildZodSchema(objectConfig: ObjectConfig): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  
  const fieldsConfig = objectConfig.fields || {}
  Object.entries(fieldsConfig).forEach(([fieldName, fieldConfig]) => {
    const field = fieldConfig as FieldConfig
    
    if (shouldHideField(fieldName, field)) {
      return
    }

    let fieldSchema: z.ZodTypeAny

    // Base schema based on field type
    switch (field.type) {
      case 'number':
      case 'currency':
      case 'percent':
        fieldSchema = z.number({ message: `${field.label || fieldName} must be a number` })
        if (field.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.min, { message: `Minimum value is ${field.min}` })
        }
        if (field.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.max, { message: `Maximum value is ${field.max}` })
        }
        break
      
      case 'email':
        fieldSchema = z.string()
        if (!field.regex) {
          fieldSchema = (fieldSchema as z.ZodString).email({ message: 'Invalid email address' })
        }
        break
      
      case 'url':
        fieldSchema = z.string()
        if (!field.regex) {
          fieldSchema = (fieldSchema as z.ZodString).url({ message: 'Invalid URL' })
        }
        break
      
      case 'boolean':
        fieldSchema = z.boolean().optional()
        break
      
      case 'date':
      case 'datetime':
        fieldSchema = z.union([z.string(), z.date()]).optional()
        break
      
      // Explicit cases for common field types
      case 'text':
      case 'password':
      case 'phone':
      case 'textarea':
      case 'markdown':
      case 'html':
      case 'select':
      case 'lookup':
        fieldSchema = z.string()
        break
      
      default:
        // Fallback for any other field types
        fieldSchema = z.string()
    }

    // Apply string-related validations
    // Note: Using 'as any' here is necessary due to Zod 4.x TypeScript limitations
    // TypeScript loses type information after instanceof checks with Zod's builder pattern
    // We use 'in' operator to safely check for method existence before calling
    let currentSchema = fieldSchema as any
    if (field.min_length !== undefined && 'min' in currentSchema) {
      currentSchema = currentSchema.min(field.min_length, { message: `Minimum length is ${field.min_length} characters` })
    }
    if (field.max_length !== undefined && 'max' in currentSchema) {
      currentSchema = currentSchema.max(field.max_length, { message: `Maximum length is ${field.max_length} characters` })
    }
    if (field.regex && 'regex' in currentSchema) {
      currentSchema = currentSchema.regex(new RegExp(field.regex), { message: 'Invalid format' })
    }
    fieldSchema = currentSchema

    // Handle required fields
    // Using 'as any' with 'in' check for type safety - Zod 4.x limitation
    if (field.required) {
      if ('min' in fieldSchema) {
        fieldSchema = (fieldSchema as any).min(1, { message: `${field.label || fieldName} is required` })
      }
    } else {
      fieldSchema = fieldSchema.optional()
    }

    shape[fieldName] = fieldSchema
  })

  return z.object(shape)
}

/**
 * DynamicForm - An advanced metadata-driven form generator
 * 
 * Extends ObjectForm with:
 * - Section-based layouts
 * - Tab-based layouts
 * - Conditional field visibility
 * - Field dependencies
 * - Zod-based validation
 * - Real-time validation
 */
export function DynamicForm({
  objectConfig,
  initialValues = {},
  onSubmit,
  onCancel,
  onSaveAndNew,
  isSubmitting = false,
  submitText = 'Save',
  saveAndNewText = 'Save & New',
  cancelText = 'Cancel',
  hideSaveAndNew = false,
  hideCancelButton = false,
  className,
  columns = 2,
  sections,
  tabs,
  fieldDependencies = {},
  formRef,
  realtimeValidation = false,
}: DynamicFormProps) {
  const validationSchema = React.useMemo(() => buildZodSchema(objectConfig), [objectConfig])
  
  const form = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(validationSchema),
    mode: realtimeValidation ? 'onChange' : 'onSubmit',
  })

  const { control, handleSubmit, reset, watch, formState } = form
  const watchedValues = watch()

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

  // Get visible fields based on dependencies
  const getVisibleFields = React.useCallback((fields: string[]) => {
    return fields.filter(fieldName => {
      const dependency = fieldDependencies[fieldName]
      if (!dependency) return true
      
      const sourceValue = watchedValues[dependency.dependsOn]
      return dependency.condition(sourceValue, watchedValues)
    })
  }, [fieldDependencies, watchedValues])

  // Render a single field
  const renderField = (fieldName: string, fieldConfig: FieldConfig, cols: 1 | 2 = columns) => {
    const isFullWidth = isFullWidthField(fieldConfig)
    
    return (
      <Controller
        key={fieldName}
        name={fieldName}
        control={control}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <div className={cn(
            isFullWidth && cols === 2 && "md:col-span-2"
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
  }

  // Get all fields from config
  const allFields = React.useMemo(() => {
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

  const handleSaveAndNew = async () => {
    const isValid = await form.trigger()
    if (!isValid) return

    const data = form.getValues()
    try {
      if (onSaveAndNew) {
        await onSaveAndNew(data)
        form.reset() // Reset form for new entry
      }
    } catch (error) {
      console.error('Save & New error:', error)
    }
  }

  // Render section-based layout
  const renderSectionLayout = () => {
    if (!sections || sections.length === 0) return null

    return (
      <div className="space-y-6">
        {sections.map(section => {
          // Check section visibility
          if (section.visible && !section.visible(watchedValues)) {
            return null
          }

          const visibleFields = getVisibleFields(section.fields)
          if (visibleFields.length === 0) return null

          return (
            <FormSection
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              collapsible={section.collapsible}
              defaultCollapsed={section.defaultCollapsed}
              columns={section.columns || columns}
            >
              {visibleFields.map(fieldName => {
                const fieldConfig = objectConfig.fields?.[fieldName] as FieldConfig
                if (!fieldConfig) return null
                return renderField(fieldName, fieldConfig, section.columns || columns)
              })}
            </FormSection>
          )
        })}
      </div>
    )
  }

  // Render tab-based layout
  const renderTabLayout = () => {
    if (!tabs || tabs.length === 0) return null

    return (
      <Tabs defaultValue={tabs[0].id} className="w-full">
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6 mt-6">
            {tab.sections.map(section => {
              // Check section visibility
              if (section.visible && !section.visible(watchedValues)) {
                return null
              }

              const visibleFields = getVisibleFields(section.fields)
              if (visibleFields.length === 0) return null

              return (
                <FormSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  icon={section.icon}
                  collapsible={section.collapsible}
                  defaultCollapsed={section.defaultCollapsed}
                  columns={section.columns || columns}
                >
                  {visibleFields.map(fieldName => {
                    const fieldConfig = objectConfig.fields?.[fieldName] as FieldConfig
                    if (!fieldConfig) return null
                    return renderField(fieldName, fieldConfig, section.columns || columns)
                  })}
                </FormSection>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  // Render default grid layout (no sections/tabs)
  const renderDefaultLayout = () => {
    return (
      <div className={cn(
        "grid gap-4",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}>
        {allFields.map(([fieldName, fieldConfig]) => {
          const field = fieldConfig as FieldConfig
          
          // Check field dependencies
          const dependency = fieldDependencies[fieldName]
          if (dependency) {
            const sourceValue = watchedValues[dependency.dependsOn]
            if (!dependency.condition(sourceValue, watchedValues)) {
              return null
            }
          }

          return renderField(fieldName, field)
        })}
      </div>
    )
  }

  const errorCount = Object.keys(formState.errors).length

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      {/* Render layout based on configuration */}
      {tabs ? renderTabLayout() : sections ? renderSectionLayout() : renderDefaultLayout()}

      {/* Form Actions */}
      <FormActions
        isSubmitting={isSubmitting}
        onSave={handleSubmit(handleFormSubmit)}
        onSaveAndNew={onSaveAndNew ? handleSaveAndNew : undefined}
        onCancel={onCancel}
        saveText={submitText}
        saveAndNewText={saveAndNewText}
        cancelText={cancelText}
        hideSaveAndNew={hideSaveAndNew || !onSaveAndNew}
        hideCancel={hideCancelButton || !onCancel}
        errorCount={errorCount}
      />
    </form>
  )
}
