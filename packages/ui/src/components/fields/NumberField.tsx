import React from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { FieldProps } from "./types"

export interface NumberFieldProps extends FieldProps<number> {
  min?: number
  max?: number
  step?: number
}

export function NumberField({
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
  min,
  max,
  step
}: NumberFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        id={name}
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? undefined : Number(e.target.value)
          // Handle NaN if necessary, but type="number" blocks most non-numbers
          onChange?.(val as number)
        }}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
