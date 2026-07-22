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
// Jobs are public (the careers site lists them to every visitor); applications
// & notes are admin-only. localStorage is kept as an offline cache so the UI
// still has something to show before the first fetch resolves.

const FN_BASE = "/.netlify/functions"

/**
 * Current Clerk session token, if any. Read via the `window.Clerk` global
 * rather than the `useAuth()` hook so plain store functions (not just React
 * components) can attach it — it's `null` for signed-out/public visitors,
 * which is fine for public endpoints and fails auth (as intended) on
 * protected ones.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  try {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken(): Promise<string | null> } } }).Clerk
    if (!clerk?.session) return null
    return await clerk.session.getToken()
  } catch {
    return null
  }
}

export async function syncFetch(path: string, method: string, body?: unknown): Promise<void> {
  try {
    const token = await getAuthToken()
    await fetch(`${FN_BASE}/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error(`Failed to sync (${method} ${path}):`, err)
  }
}

export async function fetchJSON<T>(path: string): Promise<T | undefined> {
  try {
    const token = await getAuthToken()
    const res = await fetch(`${FN_BASE}/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) throw new Error(`${path} responded ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    console.error(`Failed to fetch (${path}):`, err)
    return undefined
  }
}

export async function refreshJobs(): Promise<void> {
  const body = await fetchJSON<{ customJobs: CustomJob[]; overrides: Record<string, JobOverride>; hiddenIds: string[] }>(
    "jobs-list",
  )
  if (!body) {
    setState({ ...state, isJobsLoading: false })
    return
  }
  setState({ 
    ...state, 
    customJobs: body.customJobs, 
    overrides: body.overrides, 
    hiddenIds: body.hiddenIds,
    isJobsLoading: false
  })
  saveCustomJobs(body.customJobs)
  saveOverrides(body.overrides)
  saveHiddenIds(body.hiddenIds)
}

/** Pull the current applications/notes from Supabase — admin-only, called from the CRM. */
export async function refreshApplications(): Promise<void> {
  const body = await fetchJSON<{ applications: Application[]; notes: Note[] }>("applications-list")
  if (!body) return
  const applications = body.applications.map(normalizeApplication)
  setState({ ...state, applications, notes: body.notes })
  saveApplications(applications)
  saveNotes(body.notes)
}

type CrmState = {
  customJobs: CustomJob[]
  /** Edits layered on top of seeded jobs, keyed by job id. */
  overrides: Record<string, JobOverride>
  /** Seeded job ids the admin has deleted. */
  hiddenIds: string[]
  applications: Application[]
  notes: Note[]
  isJobsLoading: boolean
}

let state: CrmState = {
  customJobs: loadCustomJobs(),
  overrides: loadOverrides(),
  hiddenIds: loadHiddenIds(),
  applications: loadApplications(),
  notes: loadNotes(),
  isJobsLoading: true,
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

  // Jobs live in Supabase now and are public — pull the shared catalogue on
  // load so every visitor (not just admins) sees the current listings.
  // Applications/notes are admin-only and refreshed explicitly by the CRM
  // (see ApplicationsManager) once a Clerk session is available.
  void refreshJobs()
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
  void syncFetch("jobs-custom", "POST", job)
  return job
}

/** Update a job. Custom jobs are edited in place; seeded jobs get an override. */
export function updateJob(id: string, patch: Partial<Omit<Job, "id">>) {
  if (isCustomJob(id)) {
    const customJobs = state.customJobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
    setState({ ...state, customJobs })
    saveCustomJobs(customJobs)
    void syncFetch("jobs-custom", "PATCH", { id, patch })
  } else {
    const overrides = { ...state.overrides, [id]: { ...state.overrides[id], ...patch } }
    setState({ ...state, overrides })
    saveOverrides(overrides)
    void syncFetch("jobs-override", "PUT", { jobId: id, patch: overrides[id] })
  }
}

/** Delete a job. Custom jobs are removed; seeded jobs are hidden from the portal. */
export function deleteJob(id: string) {
  if (isCustomJob(id)) {
    const customJobs = state.customJobs.filter((j) => j.id !== id)
    setState({ ...state, customJobs })
    saveCustomJobs(customJobs)
    void syncFetch("jobs-custom", "DELETE", { id })
  } else {
    const hiddenIds = state.hiddenIds.includes(id) ? state.hiddenIds : [...state.hiddenIds, id]
    // Drop any stale override for a now-deleted seeded job.
    const overrides = { ...state.overrides }
    delete overrides[id]
    setState({ ...state, hiddenIds, overrides })
    saveHiddenIds(hiddenIds)
    saveOverrides(overrides)
    void syncFetch("jobs-hidden", "PUT", { jobId: id })
    void syncFetch("jobs-override", "DELETE", { jobId: id })
  }
}

/** Undo all seeded-job edits and deletions, restoring the original catalogue. */
export function resetSeededCustomizations() {
  setState({ ...state, overrides: {}, hiddenIds: [] })
  saveOverrides({})
  saveHiddenIds([])
  void syncFetch("jobs-reset", "POST")
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
  void syncFetch("apply", "POST", { ...app, resumeLink })

  return app
}

export function deleteApplication(id: string) {
  const applications = state.applications.filter((a) => a.id !== id)
  const notes = state.notes.filter((n) => n.applicationId !== id)
  setState({ ...state, applications, notes })
  saveApplications(applications)
  saveNotes(notes)
  void syncFetch("application-delete", "POST", { id })
}

export function clearApplications() {
  const ids = state.applications.map((a) => a.id)
  setState({ ...state, applications: [], notes: [] })
  saveApplications([])
  saveNotes([])
  if (ids.length > 0) void syncFetch("application-delete", "POST", { ids })
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
  if (updated) void syncFetch("application-stage", "POST", { id, stage: updated.stage, stageHistory: updated.stageHistory })
}

export function addNote(applicationId: string, text: string): Note {
  const note: Note = { id: uid("note"), applicationId, text, createdAt: new Date().toISOString() }
  const notes = [note, ...state.notes]
  setState({ ...state, notes })
  saveNotes(notes)
  void syncFetch("notes", "POST", note)
  return note
}

export function deleteNote(id: string) {
  const notes = state.notes.filter((n) => n.id !== id)
  setState({ ...state, notes })
  saveNotes(notes)
  void syncFetch("notes", "DELETE", { id })
}

// ---- Hooks ----

export function useCrmState(): CrmState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useNotes(applicationId: string) {
  return useSyncExternalStore(subscribe, () => state.notes.filter((n) => n.applicationId === applicationId))
}

export function useIsJobsLoading() {
  return useSyncExternalStore(subscribe, () => state.isJobsLoading)
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
