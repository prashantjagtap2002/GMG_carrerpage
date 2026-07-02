import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type MultiOption = { value: string; label: string; count?: number }

/**
 * A dropdown that supports selecting multiple options (multi-click),
 * styled to match the single-select trigger used elsewhere.
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select",
  className,
}: {
  options: MultiOption[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value))
    else onChange([...selected, value])
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? placeholder
        : `${placeholder} · ${selected.length}`

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
          {label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full min-w-[12rem] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No options</div>
          )}
          {options.map((o) => {
            const isSel = selected.includes(o.value)
            return (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-selected={isSel}
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSel ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {isSel && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">{o.label}</span>
                {typeof o.count === "number" && (
                  <span className="text-xs text-muted-foreground">{o.count}</span>
                )}
              </button>
            )
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-sm border-t px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
