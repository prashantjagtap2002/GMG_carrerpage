import { Check, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { MultiOption } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"

export type FilterGroup = {
  title: string
  options: MultiOption[]
  selected: string[]
  onChange: (next: string[]) => void
}

function CheckboxRow({
  checked,
  onToggle,
  label,
  count,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  count?: number
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:text-foreground">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onToggle} />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background hover:border-muted-foreground/60",
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className={cn("flex-1 truncate", checked ? "font-medium text-foreground" : "text-foreground/75")}>
        {label}
      </span>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  )
}

/**
 * IIDE-style left filter rail: a search box plus checkbox groups for
 * Department / Location / Job type. Stacks above the list on small screens.
 */
export function JobFilters({
  query,
  onQueryChange,
  groups,
  hasFilters,
  onClear,
  className,
}: {
  query: string
  onQueryChange: (v: string) => void
  groups: FilterGroup[]
  hasFilters: boolean
  onClear: () => void
  className?: string
}) {
  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h3>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search jobs..."
          className="pl-9"
        />
      </div>

      {groups.map((group) => {
        function toggle(value: string) {
          if (group.selected.includes(value)) {
            group.onChange(group.selected.filter((v) => v !== value))
          } else {
            group.onChange([...group.selected, value])
          }
        }
        if (group.options.length === 0) return null
        return (
          <div key={group.title} className="border-t pt-5">
            <h4 className="mb-2 text-sm font-semibold text-foreground">{group.title}</h4>
            <div className="-mx-1 max-h-56 space-y-0.5 overflow-y-auto pr-1">
              {group.options.map((o) => (
                <CheckboxRow
                  key={o.value}
                  checked={group.selected.includes(o.value)}
                  onToggle={() => toggle(o.value)}
                  label={o.label}
                  count={o.count}
                />
              ))}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
