import { useMemo, useState } from "react"
import { Download, Eye, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApplicationDetail } from "@/components/ApplicationDetail"
import { clearApplications, deleteApplication, useApplications } from "@/lib/crm-store"
import { deleteResume } from "@/lib/resume-store"
import { applicantName, type Application } from "@/lib/storage"
import { APPLICATION_STAGES, STAGE_DOT_CLASS } from "@/lib/pipeline"
import { formatDate } from "@/data/jobs"
import { cn } from "@/lib/utils"

function csvCell(v: string) {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCSV(apps: Application[]) {
  const headers = [
    "Submitted",
    "Name",
    "Email",
    "Applied For",
    "Stage",
    "Company",
    "Current Title",
    "Country",
    "Website",
    "Source",
    "Resume",
    "Message",
  ]
  const rows = apps.map((a) => [
    a.submittedAt,
    applicantName(a),
    a.email,
    a.jobTitle,
    a.stage,
    a.company,
    a.currentTitle,
    a.country,
    a.website,
    a.source,
    a.resumeName,
    a.message,
  ])
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `gmg-applications-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ApplicationsManager() {
  const apps = useApplications()
  const [query, setQuery] = useState("")
  const [jobFilter, setJobFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedApp = useMemo(() => apps.find((a) => a.id === selectedId) ?? null, [apps, selectedId])

  const jobOptions = useMemo(
    () => Array.from(new Set(apps.map((a) => a.jobTitle).filter(Boolean))).sort(),
    [apps],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((a) => {
      const matchesJob = jobFilter === "all" || a.jobTitle === jobFilter
      const matchesQuery =
        !q ||
        applicantName(a).toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q)
      return matchesJob && matchesQuery
    })
  }, [apps, query, jobFilter])

  function handleDelete(a: Application) {
    if (window.confirm(`Delete application from ${applicantName(a)}?`)) {
      deleteApplication(a.id)
      void deleteResume(a.id)
      if (selectedId === a.id) setSelectedId(null)
    }
  }
  function handleClear() {
    if (apps.length === 0) return
    if (window.confirm(`Delete all ${apps.length} applications? This cannot be undone.`)) {
      apps.forEach((a) => void deleteResume(a.id))
      clearApplications()
      setSelectedId(null)
    }
  }

  if (selectedApp) {
    return (
      <ApplicationDetail
        app={selectedApp}
        onClose={() => setSelectedId(null)}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Applications</h2>
          <p className="text-sm text-muted-foreground">
            {apps.length} {apps.length === 1 ? "submission" : "submissions"} · {filtered.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={apps.length === 0}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Clear all
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or job..."
            className="pl-9"
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobOptions.map((j) => (
              <SelectItem key={j} value={j}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No applications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Applications submitted through the portal's &ldquo;I&apos;m interested&rdquo; form will
            appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Applied For</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedId(a.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{applicantName(a)}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.jobTitle || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOT_CLASS[a.stage])} />
                      {APPLICATION_STAGES.find((s) => s.value === a.stage)?.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.country || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View details"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(a.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(a)
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
