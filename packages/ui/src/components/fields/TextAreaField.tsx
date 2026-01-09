import React from "react"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { FieldProps } from "./types"

export function TextAreaField({
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
}: FieldProps<string>) {
  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Textarea
        id={name}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(error && "border-destructive focus-visible:ring-destructive", "min-h-[80px]")}
      />
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
