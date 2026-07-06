import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JobCard } from "@/components/JobCard"
import { JobFilters, type FilterGroup } from "@/components/JobFilters"
import { useAllJobs } from "@/lib/crm-store"

// Build filter options with a count of matching roles (like the IIDE filters).
function withCounts(getValue: (v: string) => number) {
  return (values: string[]) =>
    values.map((v) => ({ value: v, label: v, count: getValue(v) }))
}

export function HomePage() {
  const [query, setQuery] = useState("")
  const [dept, setDept] = useState<string[]>([])
  const [loc, setLoc] = useState<string[]>([])
  const [type, setType] = useState<string[]>([])
  const [sort, setSort] = useState("newest")

  const allJobs = useAllJobs()
  const departments = useMemo(() => Array.from(new Set(allJobs.map((j) => j.department))).sort(), [allJobs])
  const locations = useMemo(() => Array.from(new Set(allJobs.map((j) => j.city).filter(Boolean))).sort(), [allJobs])
  const jobTypes = useMemo(() => Array.from(new Set(allJobs.map((j) => j.jobType).filter(Boolean))).sort(), [allJobs])
  const deptOptions = useMemo(() => withCounts((v) => allJobs.filter((j) => j.department === v).length)(departments), [allJobs, departments])
  const locOptions = useMemo(() => withCounts((v) => allJobs.filter((j) => j.city === v).length)(locations), [allJobs, locations])
  const typeOptions = useMemo(() => withCounts((v) => allJobs.filter((j) => j.jobType === v).length)(jobTypes), [allJobs, jobTypes])

  const hasFilters = query.trim() !== "" || dept.length > 0 || loc.length > 0 || type.length > 0

  function clearFilters() {
    setQuery("")
    setDept([])
    setLoc([])
    setType([])
  }

  const groups: FilterGroup[] = [
    { title: "Department", options: deptOptions, selected: dept, onChange: setDept },
    { title: "Location", options: locOptions, selected: loc, onChange: setLoc },
    { title: "Job type", options: typeOptions, selected: type, onChange: setType },
  ]

  const filtered = useMemo(() => {
    const list = allJobs.filter((j) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q)
      const matchesDept = dept.length === 0 || dept.includes(j.department)
      const matchesLoc = loc.length === 0 || loc.includes(j.city)
      const matchesType = type.length === 0 || type.includes(j.jobType)
      return matchesQuery && matchesDept && matchesLoc && matchesType
    })
    return [...list].sort((a, b) => {
      const da = new Date(a.dateOpened).getTime() || 0
      const db = new Date(b.dateOpened).getTime() || 0
      if (sort === "newest") return db - da
      if (sort === "oldest") return da - db
      if (sort === "title") return a.title.localeCompare(b.title)
      return 0
    })
  }, [allJobs, query, dept, loc, type, sort])

  return (
    <main id="jobs">
      <section id="open-roles" className="border-b bg-secondary/40">
        <div className="container py-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Discover Career Opportunities at GMG</h2>
          <p className="mt-2 text-muted-foreground">
            Find your next role and apply directly — no redirects.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <JobFilters
            query={query}
            onQueryChange={setQuery}
            groups={groups}
            hasFilters={hasFilters}
            onClear={clearFilters}
            className="lg:sticky lg:top-8 lg:self-start"
          />

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {filtered.length} open {filtered.length === 1 ? "role" : "roles"}
              </p>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">Title A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-16 text-center">
                <p className="text-lg font-medium">No jobs match your search</p>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing some filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
