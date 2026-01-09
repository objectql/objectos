import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { FieldProps } from "./types"

export function SelectField({
  value,
  onChange,
  disabled,
  readOnly,
  className,
  placeholder,
  error,
  label,
  required,
  description,
  name,
  options = [],
}: FieldProps<string | number>) {
  const normalizedOptions = React.useMemo(() => {
    return options.map((option) => {
      if (typeof option === "object" && option !== null && "value" in option) {
        return option
      }
      return { label: String(option), value: option }
    })
  }, [options])

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select
        value={value?.toString()}
        onValueChange={onChange}
        disabled={disabled || readOnly}
      >
        <SelectTrigger 
            id={name}
            className={cn(error && "border-destructive focus:ring-destructive")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value?.toString() ?? ""}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
