import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, FileText, Mail, MessageSquarePlus, Send, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/data/jobs"
import { addNote, deleteNote, updateApplicationStage, useNotes } from "@/lib/crm-store"
import { getResume } from "@/lib/resume-store"
import { applicantName, type Application, type ApplicationStage } from "@/lib/storage"
import { usePipelineStore } from "@/lib/pipeline"
import { cn } from "@/lib/utils"

/** Fetch a stored resume from R2 (via the Worker) and open it in a new tab. */
async function openResume(app: Application) {
  try {
    const stored = await getResume(app.id)
    if (!stored) {
      window.alert(
        "No resume file is stored for this application.\n\n" +
          "Either none was attached, resume storage isn't configured yet, or it was submitted " +
          "before resume storage was added.",
      )
      return
    }
    const url = URL.createObjectURL(stored.blob)
    window.open(url, "_blank", "noopener,noreferrer")
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    window.alert("Couldn't open the resume file.")
  }
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

type TimelineEntry =
  | { kind: "stage"; at: string; stage: ApplicationStage }
  | { kind: "note"; at: string; id: string; text: string }

function groupByDay(entries: TimelineEntry[]) {
  const groups: { label: string; entries: TimelineEntry[] }[] = []
  for (const entry of entries) {
    const label = dayLabel(entry.at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.entries.push(entry)
    else groups.push({ label, entries: [entry] })
  }
  return groups
}

export function ApplicationDetail({
  app,
  onClose,
  onDelete,
}: {
  app: Application
  onClose: () => void
  onDelete: (app: Application) => void
}) {
  const { stages } = usePipelineStore()
  const [tab, setTab] = useState<"all" | "notes">("all")
  const [draft, setDraft] = useState("")
  const notes = useNotes(app.id)
  const name = applicantName(app)

  const stageEntries: TimelineEntry[] = app.stageHistory.map((e) => ({
    kind: "stage",
    at: e.at,
    stage: e.stage,
  }))
  const noteEntries: TimelineEntry[] = notes.map((n) => ({
    kind: "note",
    at: n.createdAt,
    id: n.id,
    text: n.text,
  }))
  const combined = [...stageEntries, ...noteEntries].sort((a, b) => b.at.localeCompare(a.at))
  const timeline = tab === "notes" ? noteEntries : combined
  const groups = groupByDay(timeline)

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    addNote(app.id, text)
    setDraft("")
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onClose}>
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials(name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{name}</h2>
              <Badge variant="secondary" className="gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", stages.find((s) => s.id === app.stage)?.color || "bg-gray-400")} />
                {stages.find((s) => s.id === app.stage)?.label || app.stage}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Applied for <span className="font-medium text-foreground">{app.jobTitle || "-"}</span>{" "}
              · {formatDate(app.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/jobs/${app.jobId}`}>View job</Link>
          </Button>
          {app.resumeName && (
            <Button variant="outline" size="sm" onClick={() => openResume(app)}>
              <FileText className="h-4 w-4" /> View resume
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${app.email}`}>
              <Mail className="h-4 w-4" /> Email
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(app)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex w-full overflow-hidden rounded-full border border-border">
        {stages.map((s) => {
          const isActive = app.stage === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => updateApplicationStage(app.id, s.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-border",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-primary" : "bg-muted-foreground/50")} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Details */}
        <div className="space-y-4 rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>
          <dl className="space-y-3 text-sm">
            <DetailField label="Email" value={app.email} />
            <DetailField label="Company" value={app.company} />
            <DetailField label="Current Title" value={app.currentTitle} />
            <DetailField label="Website" value={app.website} />
            <DetailField label="Country" value={app.country} />
            <DetailField label="Source" value={app.source} />
            {app.resumeName && <DetailField label="Resume" value={app.resumeName} />}
          </dl>
          {app.message && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-foreground/90">
                {app.message}
              </p>
            </div>
          )}
        </div>

        {/* Activity / Notes */}
        <div className="rounded-lg border p-5">
          <div className="flex gap-1 border-b pb-3">
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              All {combined.length}
            </TabButton>
            <TabButton active={tab === "notes"} onClick={() => setTab("notes")}>
              Notes {notes.length}
            </TabButton>
          </div>

          <form onSubmit={handleAddNote} className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send className="h-4 w-4" /> Add
            </Button>
          </form>

          <div className="mt-5 space-y-6">
            {groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {tab === "notes" ? "No notes yet." : "No activity yet."}
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.label}
                  </p>
                  <ul className="space-y-3">
                    {g.entries.map((entry) =>
                      entry.kind === "stage" ? (
                        <li
                          key={`stage-${entry.at}`}
                          className="flex items-start gap-3 text-sm text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                              stages.find((s) => s.id === entry.stage)?.color || "bg-gray-400",
                            )}
                          />
                          <span>
                            Stage set to{" "}
                            <span className="font-medium text-foreground">
                              {stages.find((s) => s.id === entry.stage)?.label || entry.stage}
                            </span>{" "}
                            · {timeLabel(entry.at)}
                          </span>
                        </li>
                      ) : (
                        <li key={entry.id} className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
                          <MessageSquarePlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-wrap text-sm text-foreground/90">{entry.text}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{timeLabel(entry.at)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteNote(entry.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all text-foreground/90">{value || "-"}</dd>
    </div>
  )
}
