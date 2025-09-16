import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-bold ring-offset-background transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-intense hover:shadow-dramatic transform hover:scale-110 hover:brightness-110 hover:saturate-125",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-intense hover:shadow-dramatic transform hover:scale-110 hover:brightness-110",
        outline:
          "border-4 border-primary bg-background hover:bg-primary/20 hover:text-primary shadow-dramatic hover:shadow-intense transform hover:scale-108 hover:border-primary/80",
        secondary:
          "bg-gradient-to-r from-secondary to-accent text-secondary-foreground shadow-intense hover:shadow-dramatic transform hover:scale-110 hover:brightness-110",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground transition-all duration-300 hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-16 rounded-xl px-10 text-xl font-black",
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