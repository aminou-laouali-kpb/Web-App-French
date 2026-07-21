import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "hot" | "warm" | "standard" | "cold" | "a_qualifier"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80": variant === "destructive",
          "text-foreground": variant === "outline",
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300": variant === "hot",
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300": variant === "warm",
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300": variant === "standard",
          "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300": variant === "cold",
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300": variant === "a_qualifier",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
