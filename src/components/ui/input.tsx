import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-2xl border-2 border-input bg-background/90 backdrop-blur-xl px-6 py-4 text-lg shadow-xl transition-all duration-500 file:border-0 file:bg-transparent file:text-lg file:font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-4 focus-visible:border-primary/60 hover:border-primary/40 hover:shadow-2xl hover:bg-background/95 disabled:cursor-not-allowed disabled:opacity-50 glass",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }