
export interface FieldProps<T = any> {
  value?: T
  onChange?: (value: T | undefined) => void
  disabled?: boolean
  readOnly?: boolean
  className?: string
  placeholder?: string
  error?: string
  
  // Basic metadata
  name?: string
  label?: string
  required?: boolean
  description?: string
  
  // Specific options
  options?: ({ label: string; value: any } | string)[]
}
