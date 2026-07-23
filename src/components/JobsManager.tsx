import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JdFormDialog, type JdFormValues } from "@/components/JdFormDialog"
import {
  addJob,
  deleteJob,
  resetSeededCustomizations,
  updateJob,
  useAllJobs,
  useCustomJobs,
  useIsJobsLoading,
  useSeededCustomizationCount,
} from "@/lib/crm-store"
import { Loader2 } from "lucide-react"
import { formatDate, locationString, type Job } from "@/data/jobs"

export function JobsManager() {
  const allJobs = useAllJobs()
  const customJobs = useCustomJobs()
  const customIds = useMemo(() => new Set(customJobs.map((j) => j.id)), [customJobs])
  const customizationCount = useSeededCustomizationCount()
  const isJobsLoading = useIsJobsLoading()

  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allJobs
    return allJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.city.toLowerCase().includes(q),
    )
  }, [allJobs, query])

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(job: Job) {
    setEditing(job)
    setDialogOpen(true)
  }
  function handleSubmit(values: JdFormValues) {
    if (editing) updateJob(editing.id, values)
    else addJob(values)
    setDialogOpen(false)
    setEditing(null)
  }
  function handleDelete(job: Job) {
    if (window.confirm(`Delete "${job.title}"? This removes it from the portal.`)) {
      deleteJob(job.id)
    }
  }
  function handleReset() {
    if (
      window.confirm(
        `Restore ${customizationCount} seeded ${customizationCount === 1 ? "job" : "jobs"} to their original state? This undoes edits and deletions of the built-in catalogue.`,
      )
    ) {
      resetSeededCustomizations()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Job Descriptions</h2>
          <p className="text-sm text-muted-foreground">
            {allJobs.length} total · {customJobs.length} added via CRM ·{" "}
            {allJobs.length - customJobs.length} seeded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {customizationCount > 0 && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Restore defaults
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add JD
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, department or city..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Posted</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isJobsLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-gmg-gold" />
                    <span>Loading jobs...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No jobs found.
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
              <Row
                key={job.id}
                job={job}
                isCustom={customIds.has(job.id)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
              ))
            )}
          </tbody>
        </table>
      </div>

      <JdFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  )
}

function Row({
  job,
  isCustom,
  onEdit,
  onDelete,
}: {
  job: Job
  isCustom: boolean
  onEdit: (j: Job) => void
  onDelete: (j: Job) => void
}) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 font-medium">{job.title}</td>
      <td className="px-4 py-3 text-muted-foreground">{job.department}</td>
      <td className="px-4 py-3 text-muted-foreground">{locationString(job) || "-"}</td>
      <td className="px-4 py-3 text-muted-foreground">{job.jobType}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(job.dateOpened) || "-"}</td>
      <td className="px-4 py-3">
        {isCustom ? <Badge variant="secondary">CRM</Badge> : <Badge variant="outline">Seeded</Badge>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon" title="View on portal">
            <Link to={`/jobs/${job.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(job)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => onDelete(job)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
