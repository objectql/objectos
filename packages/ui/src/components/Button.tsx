import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Filled button - primary action (Apple blue)
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        // Destructive - red for delete actions
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
        // Outline - secondary actions
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm",
        // Secondary - subtle background
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        // Ghost - minimal style
        ghost: "hover:bg-gray-100 text-gray-700",
        // Link - text only
        link: "text-blue-600 underline-offset-4 hover:underline",
        // Tinted - Apple-style tinted button
        tinted: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

