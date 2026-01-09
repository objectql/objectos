import React from "react"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { FieldProps } from "./types"

export function BooleanField({
  value,
  onChange,
  disabled,
  readOnly,
  className,
  error,
  label,
  required,
  description,
  name,
}: FieldProps<boolean>) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={value}
          onCheckedChange={(checked) => {
            if (readOnly) return;
            onChange?.(checked as boolean)
          }}
          disabled={disabled || readOnly}
          className={cn(error && "border-destructive")}
        />
        {label && (
          <Label htmlFor={name} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", error && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
      </div>
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
