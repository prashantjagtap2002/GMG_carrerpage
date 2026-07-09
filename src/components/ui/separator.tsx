import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A thin horizontal rule used to separate sections inside cards/forms.
 * Lightweight stand-in for the shadcn/ui Separator primitive (no Radix
 * dependency needed for this project) — uses the themed --border color so it
 * picks up the GMG dark hairline automatically.
 */
const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
