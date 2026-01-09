import * as React from "react"
import { cn } from "../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-apple focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          {
            "bg-gray-100 text-gray-700": variant === "default",
            "bg-green-100 text-green-700": variant === "success",
            "bg-yellow-100 text-yellow-700": variant === "warning",
            "bg-red-100 text-red-700": variant === "danger",
            "bg-blue-100 text-blue-700": variant === "info",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
