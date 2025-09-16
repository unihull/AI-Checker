import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-base font-bold transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-4 disabled:pointer-events-none disabled:opacity-50 active:scale-95 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary via-chart-1 to-chart-2 text-primary-foreground shadow-2xl hover:shadow-3xl hover:from-chart-2 hover:via-chart-1 hover:to-primary transform hover:scale-110 hover:-translate-y-2 border-2 border-primary/20 hover:border-primary/40",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-2xl hover:shadow-3xl hover:from-red-600 hover:to-destructive transform hover:scale-110 hover:-translate-y-2",
        outline:
          "border-3 border-primary/40 bg-background/80 backdrop-blur-xl shadow-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-chart-1/10 hover:text-accent-foreground hover:shadow-2xl hover:border-primary/60 transform hover:scale-110 hover:-translate-y-2 glass",
        secondary:
          "bg-gradient-to-r from-secondary to-muted text-secondary-foreground shadow-xl hover:shadow-2xl hover:from-muted hover:to-secondary transform hover:scale-110 hover:-translate-y-2",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-lg transform hover:scale-105 hover:-translate-y-1",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transform hover:scale-105",
      },
      size: {
        default: "h-12 px-8 py-4",
        sm: "h-10 rounded-xl px-6 text-sm font-semibold",
        lg: "h-16 rounded-3xl px-12 text-xl font-black",
        icon: "h-12 w-12",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }