import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Download, Eye, FileText, Mail, Search, Trash2, X } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { clearApplications, deleteApplication, useApplications } from "@/lib/crm-store"
import { deleteResume, getResume } from "@/lib/resume-store"
import { formatDate } from "@/data/jobs"
import type { Application } from "@/lib/storage"

/** Fetch a stored résumé from IndexedDB and open it in a new tab (or download). */
async function openResume(app: Application) {
  try {
    const stored = await getResume(app.id)
    if (!stored) {
      window.alert(
        "No résumé file is stored for this application.\n\n" +
          "It may have been submitted before file storage was added, or from a different browser/device, " +
          "so only the file name was recorded in that case.",
      )
      return
    }
    const url = URL.createObjectURL(stored.blob)
    window.open(url, "_blank", "noopener,noreferrer")
    // Give the new tab time to load before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    window.alert("Couldn't open the résumé file.")
  }
}

function fullName(a: Application) {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || "-"
}

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
    fullName(a),
    a.email,
    a.jobTitle,
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
  const [selected, setSelected] = useState<Application | null>(null)

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
        fullName(a).toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q)
      return matchesJob && matchesQuery
    })
  }, [apps, query, jobFilter])

  function handleDelete(a: Application) {
    if (window.confirm(`Delete application from ${fullName(a)}?`)) {
      deleteApplication(a.id)
      void deleteResume(a.id)
      if (selected?.id === a.id) setSelected(null)
    }
  }
  function handleClear() {
    if (apps.length === 0) return
    if (window.confirm(`Delete all ${apps.length} applications? This cannot be undone.`)) {
      apps.forEach((a) => void deleteResume(a.id))
      clearApplications()
      setSelected(null)
    }
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
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{fullName(a)}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.jobTitle || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.country || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.source || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="View details" onClick={() => setSelected(a)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => handleDelete(a)}
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

      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
function ApplicationDetail({ app, onClose }: { app: Application | null; onClose: () => void }) {
  return (
    <Dialog open={!!app} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        {app && (
          <>
            <DialogHeader>
              <DialogTitle>{fullName(app)}</DialogTitle>
              <DialogDescription>
                Applied for <span className="font-medium text-foreground">{app.jobTitle || "-"}</span>{" "}
                · {formatDate(app.submittedAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{app.source || "No source"}</Badge>
                {app.country && <Badge variant="outline">{app.country}</Badge>}
                {app.resumeName && <Badge variant="outline">Resume: {app.resumeName}</Badge>}
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <DetailField label="Email" value={app.email} />
                <DetailField label="Company" value={app.company} />
                <DetailField label="Current Title" value={app.currentTitle} />
                <DetailField label="Website" value={app.website} />
                <DetailField label="Country" value={app.country} />
                <DetailField label="Source" value={app.source} />
              </dl>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-foreground/90">
                  {app.message || "-"}
                </p>
              </div>
              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/jobs/${app.jobId}`}>View job</Link>
                  </Button>
                  {app.resumeName && (
                    <Button variant="outline" size="sm" onClick={() => openResume(app)}>
                      <FileText className="h-4 w-4" /> View résumé
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${app.email}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" /> Close
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground/90">{value || "-"}</dd>
    </div>
  )
}

