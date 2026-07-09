import { useMemo, useSyncExternalStore } from "react"
import { seededJobs, type Job } from "@/data/jobs"
import {
  APPS_KEY,
  DEFAULT_STAGE,
  HIDDEN_KEY,
  JOBS_KEY,
  NOTES_KEY,
  OVERRIDES_KEY,
  loadApplications,
  loadCustomJobs,
  loadHiddenIds,
  loadNotes,
  loadOverrides,
  normalizeApplication,
  saveApplications,
  saveCustomJobs,
  saveHiddenIds,
  saveNotes,
  saveOverrides,
  uid,
  type Application,
  type ApplicationStage,
  type CustomJob,
  type JobOverride,
  type Note,
} from "@/lib/storage"

// ---- Supabase sync (via Netlify Functions) ----
// Applications & notes are shared across devices through Supabase; jobs stay
// local-only. localStorage is kept as an offline cache so the UI still has
// something to show before the first fetch resolves.

const FN_BASE = "/.netlify/functions"

async function postJSON(path: string, body: unknown): Promise<void> {
  try {
    await fetch(`${FN_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`Failed to sync (${path}):`, err)
  }
}

async function deleteJSON(path: string, body: unknown): Promise<void> {
  try {
    await fetch(`${FN_BASE}/${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`Failed to sync delete (${path}):`, err)
  }
}

/** Pull the current applications/notes from Supabase so every device agrees. */
export async function refreshApplications(): Promise<void> {
  try {
    const res = await fetch(`${FN_BASE}/applications-list`)
    if (!res.ok) throw new Error(`applications-list responded ${res.status}`)
    const body = (await res.json()) as { applications: Application[]; notes: Note[] }
    const applications = body.applications.map(normalizeApplication)
    setState({ ...state, applications, notes: body.notes })
    saveApplications(applications)
    saveNotes(body.notes)
  } catch (err) {
    console.error("Failed to fetch applications from Supabase:", err)
  }
}

type CrmState = {
  customJobs: CustomJob[]
  /** Edits layered on top of seeded jobs, keyed by job id. */
  overrides: Record<string, JobOverride>
  /** Seeded job ids the admin has deleted. */
  hiddenIds: string[]
  applications: Application[]
  notes: Note[]
}

let state: CrmState = {
  customJobs: loadCustomJobs(),
  overrides: loadOverrides(),
  hiddenIds: loadHiddenIds(),
  applications: loadApplications(),
  notes: loadNotes(),
}

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setState(next: CrmState) {
  state = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getState() {
  return state
}

// Keep multiple tabs in sync (e.g. the portal open in one tab, the CRM in another).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (
      e.key === JOBS_KEY ||
      e.key === APPS_KEY ||
      e.key === OVERRIDES_KEY ||
      e.key === HIDDEN_KEY ||
      e.key === NOTES_KEY
    ) {
      state = {
        customJobs: loadCustomJobs(),
        overrides: loadOverrides(),
        hiddenIds: loadHiddenIds(),
        applications: loadApplications(),
        notes: loadNotes(),
      }
      emit()
    }
  })

  // Applications/notes live in Supabase now — pull the shared list on load so
  // this device shows what every other device has submitted.
  void refreshApplications()
}

/**
 * Merge CRM-added jobs with the seeded catalogue, dropping seeded jobs the
 * admin deleted and applying any per-job edits (overrides).
 */
function composeJobs(s: CrmState): Job[] {
  const hidden = new Set(s.hiddenIds)
  const seeded = seededJobs
    .filter((j) => !hidden.has(j.id))
    .map((j) => (s.overrides[j.id] ? { ...j, ...s.overrides[j.id] } : j))
  return [...s.customJobs, ...seeded]
}

// ---- Non-reactive getters (handy for one-off lookups) ----

/** All jobs: CRM-added first, then the seeded catalogue (edits/deletes applied). */
export function getAllJobs() {
  return composeJobs(state)
}

export function getJobById(id: string) {
  return getAllJobs().find((j) => j.id === id)
}

function isCustomJob(id: string) {
  return state.customJobs.some((j) => j.id === id)
}

// ---- Actions ----

export function addJob(input: Omit<CustomJob, "id" | "createdAt">): CustomJob {
  const job: CustomJob = { ...input, id: uid("custom"), createdAt: new Date().toISOString() }
  const customJobs = [job, ...state.customJobs]
  setState({ ...state, customJobs })
  saveCustomJobs(customJobs)
  return job
}

/** Update a job. Custom jobs are edited in place; seeded jobs get an override. */
export function updateJob(id: string, patch: Partial<Omit<Job, "id">>) {
  if (isCustomJob(id)) {
    const customJobs = state.customJobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
    setState({ ...state, customJobs })
    saveCustomJobs(customJobs)
  } else {
    const overrides = { ...state.overrides, [id]: { ...state.overrides[id], ...patch } }
    setState({ ...state, overrides })
    saveOverrides(overrides)
  }
}

/** Delete a job. Custom jobs are removed; seeded jobs are hidden from the portal. */
export function deleteJob(id: string) {
  if (isCustomJob(id)) {
    const customJobs = state.customJobs.filter((j) => j.id !== id)
    setState({ ...state, customJobs })
    saveCustomJobs(customJobs)
  } else {
    const hiddenIds = state.hiddenIds.includes(id) ? state.hiddenIds : [...state.hiddenIds, id]
    // Drop any stale override for a now-deleted seeded job.
    const overrides = { ...state.overrides }
    delete overrides[id]
    setState({ ...state, hiddenIds, overrides })
    saveHiddenIds(hiddenIds)
    saveOverrides(overrides)
  }
}

/** Undo all seeded-job edits and deletions, restoring the original catalogue. */
export function resetSeededCustomizations() {
  setState({ ...state, overrides: {}, hiddenIds: [] })
  saveOverrides({})
  saveHiddenIds([])
}

export function addApplication(
  input: Omit<Application, "id" | "submittedAt" | "stage" | "stageHistory">,
): Application {
  const submittedAt = new Date().toISOString()
  const app: Application = {
    ...input,
    id: uid("app"),
    submittedAt,
    stage: DEFAULT_STAGE,
    stageHistory: [{ stage: DEFAULT_STAGE, at: submittedAt }],
  }
  const applications = [app, ...state.applications]
  setState({ ...state, applications })
  saveApplications(applications)

  const workerUrl = (import.meta.env.VITE_RESUME_WORKER_URL || "").replace(/\/+$/, "")
  const resumeLink = app.resumeName && workerUrl ? `${workerUrl}/resumes/${app.id}` : ""
  void postJSON("apply", { ...app, resumeLink })

  return app
}

export function deleteApplication(id: string) {
  const applications = state.applications.filter((a) => a.id !== id)
  const notes = state.notes.filter((n) => n.applicationId !== id)
  setState({ ...state, applications, notes })
  saveApplications(applications)
  saveNotes(notes)
  void postJSON("application-delete", { id })
}

export function clearApplications() {
  const ids = state.applications.map((a) => a.id)
  setState({ ...state, applications: [], notes: [] })
  saveApplications([])
  saveNotes([])
  if (ids.length > 0) void postJSON("application-delete", { ids })
}

/** Move an application to a new pipeline stage, recording the transition in its timeline. */
export function updateApplicationStage(id: string, stage: ApplicationStage) {
  const applications = state.applications.map((a) =>
    a.id === id && a.stage !== stage
      ? { ...a, stage, stageHistory: [...a.stageHistory, { stage, at: new Date().toISOString() }] }
      : a,
  )
  setState({ ...state, applications })
  saveApplications(applications)

  const updated = applications.find((a) => a.id === id)
  if (updated) void postJSON("application-stage", { id, stage: updated.stage, stageHistory: updated.stageHistory })
}

export function addNote(applicationId: string, text: string): Note {
  const note: Note = { id: uid("note"), applicationId, text, createdAt: new Date().toISOString() }
  const notes = [note, ...state.notes]
  setState({ ...state, notes })
  saveNotes(notes)
  void postJSON("notes", note)
  return note
}

export function deleteNote(id: string) {
  const notes = state.notes.filter((n) => n.id !== id)
  setState({ ...state, notes })
  saveNotes(notes)
  void deleteJSON("notes", { id })
}

// ---- Hooks ----

export function useCrmState(): CrmState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useAllJobs() {
  const s = useCrmState()
  return useMemo(() => composeJobs(s), [s])
}

export function useJobById(id: string | undefined) {
  const all = useAllJobs()
  return useMemo(() => (id ? all.find((j) => j.id === id) : undefined), [all, id])
}

export function useCustomJobs() {
  return useCrmState().customJobs
}

/** Number of seeded jobs the admin has edited or deleted (for the reset control). */
export function useSeededCustomizationCount() {
  const s = useCrmState()
  return Object.keys(s.overrides).length + s.hiddenIds.length
}

export function useApplications() {
  return useCrmState().applications
}

export function useApplicationById(id: string | undefined) {
  const apps = useApplications()
  return useMemo(() => (id ? apps.find((a) => a.id === id) : undefined), [apps, id])
}

export function useNotes(applicationId: string | undefined) {
  const notes = useCrmState().notes
  return useMemo(
    () =>
      applicationId
        ? notes
            .filter((n) => n.applicationId === applicationId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [notes, applicationId],
  )
}
