import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={props["aria-checked"]}
    data-state={props["data-state"]}
    value={props["value"]}
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <span
      className={cn("flex items-center justify-center text-current data-[state=checked]:animate-in data-[state=unchecked]:animate-out data-[state=checked]:zoom-in-95 data-[state=unchecked]:zoom-out-95")}
      data-state={props["data-state"]}
    >
      <Check className="h-4 w-4" />
    </span>
  </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
