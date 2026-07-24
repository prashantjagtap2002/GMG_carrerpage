import { useMemo, useSyncExternalStore } from "react"
import { seededJobs, type Job } from "@/data/jobs"
import { toastError } from "@/lib/toast"
import {
  DEFAULT_STAGE,
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

export const FN_BASE = "/.netlify/functions"

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
  } catch (err) {
    console.error("Failed to get Clerk auth token:", err)
    return null
  }
}

export async function syncFetch(path: string, method: string, body?: unknown): Promise<boolean> {
  try {
    const token = await getAuthToken()
    const res = await fetch(`${FN_BASE}/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(`Sync failed (${method} ${path}): HTTP ${res.status}`, text)
      toastError("Changes couldn't be saved. Please check your connection and try again.")
      return false
    }
    return true
  } catch (err) {
    console.error(`Failed to sync (${method} ${path}):`, err)
    toastError("Changes couldn't be saved. Please check your connection and try again.")
    return false
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
    setState({ ...state, isJobsLoading: false, jobsLoadError: true })
    return
  }
  setState({ 
    ...state, 
    customJobs: body.customJobs, 
    overrides: body.overrides, 
    hiddenIds: body.hiddenIds,
    isJobsLoading: false,
    jobsLoadError: false,
  })
  saveCustomJobs(body.customJobs)
  saveOverrides(body.overrides)
  saveHiddenIds(body.hiddenIds)
}

/** Pull the current applications/notes from Supabase — admin-only, called from the CRM. */
export async function refreshApplications(): Promise<void> {
  const body = await fetchJSON<{ applications: Application[]; notes: Note[] }>("applications-list")
  if (!body) {
    setState({ ...state, appsLoadError: true })
    return
  }
  const applications = body.applications.map(normalizeApplication)
  setState({ ...state, applications, notes: body.notes, appsLoadError: false })
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
  jobsLoadError: boolean
  appsLoadError: boolean
}

let state: CrmState = {
  customJobs: loadCustomJobs(),
  overrides: loadOverrides(),
  hiddenIds: loadHiddenIds(),
  applications: loadApplications(),
  notes: loadNotes(),
  isJobsLoading: true,
  jobsLoadError: false,
  appsLoadError: false,
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

if (typeof window !== "undefined") {
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

export async function addJob(input: Omit<CustomJob, "id" | "createdAt">): Promise<CustomJob> {
  const job: CustomJob = { ...input, id: uid("custom"), createdAt: new Date().toISOString() }
  const prevCustomJobs = state.customJobs
  const customJobs = [job, ...state.customJobs]
  setState({ ...state, customJobs })
  saveCustomJobs(customJobs)
  const ok = await syncFetch("jobs-custom", "POST", job)
  if (!ok) {
    setState({ ...state, customJobs: prevCustomJobs })
    saveCustomJobs(prevCustomJobs)
  }
  return job
}

/** Update a job. Custom jobs are edited in place; seeded jobs get an override. */
export async function updateJob(id: string, patch: Partial<Omit<Job, "id">>) {
  if (isCustomJob(id)) {
    const prevCustomJobs = state.customJobs
    const customJobs = state.customJobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
    setState({ ...state, customJobs })
    saveCustomJobs(customJobs)
    const ok = await syncFetch("jobs-custom", "PATCH", { id, patch })
    if (!ok) {
      setState({ ...state, customJobs: prevCustomJobs })
      saveCustomJobs(prevCustomJobs)
    }
  } else {
    const prevOverrides = { ...state.overrides }
    const overrides = { ...state.overrides, [id]: { ...state.overrides[id], ...patch } }
    setState({ ...state, overrides })
    saveOverrides(overrides)
    const ok = await syncFetch("jobs-override", "PUT", { jobId: id, patch: overrides[id] })
    if (!ok) {
      setState({ ...state, overrides: prevOverrides })
      saveOverrides(prevOverrides)
    }
  }
}

/** Delete a job. Custom jobs are removed; seeded jobs are hidden from the portal. */
export async function deleteJob(id: string) {
  if (isCustomJob(id)) {
    const prevCustomJobs = state.customJobs
    const prevApplications = state.applications
    const prevNotes = state.notes
    const customJobs = state.customJobs.filter((j) => j.id !== id)
    // Also remove local applications & notes for this job (the server
    // cascade-deletes them to satisfy foreign key constraints).
    const removedAppIds = new Set(state.applications.filter((a) => a.jobId === id).map((a) => a.id))
    const applications = state.applications.filter((a) => a.jobId !== id)
    const notes = removedAppIds.size > 0
      ? state.notes.filter((n) => !removedAppIds.has(n.applicationId))
      : state.notes
    setState({ ...state, customJobs, applications, notes })
    saveCustomJobs(customJobs)
    saveApplications(applications)
    saveNotes(notes)
    const ok = await syncFetch(`jobs-custom?id=${encodeURIComponent(id)}`, "DELETE", { id })
    if (!ok) {
      setState({ ...state, customJobs: prevCustomJobs, applications: prevApplications, notes: prevNotes })
      saveCustomJobs(prevCustomJobs)
      saveApplications(prevApplications)
      saveNotes(prevNotes)
    }
  } else {
    const prevHiddenIds = state.hiddenIds
    const prevOverrides = { ...state.overrides }
    const hiddenIds = state.hiddenIds.includes(id) ? state.hiddenIds : [...state.hiddenIds, id]
    // Drop any stale override for a now-deleted seeded job.
    const overrides = { ...state.overrides }
    delete overrides[id]
    setState({ ...state, hiddenIds, overrides })
    saveHiddenIds(hiddenIds)
    saveOverrides(overrides)
    const results = await Promise.all([
      syncFetch("jobs-hidden", "PUT", { jobId: id }),
      syncFetch("jobs-override", "DELETE", { jobId: id }),
    ])
    if (!results[0] || !results[1]) {
      setState({ ...state, hiddenIds: prevHiddenIds, overrides: prevOverrides })
      saveHiddenIds(prevHiddenIds)
      saveOverrides(prevOverrides)
    }
  }
}

/** Undo all seeded-job edits and deletions, restoring the original catalogue. */
export async function resetSeededCustomizations() {
  const prevOverrides = { ...state.overrides }
  const prevHiddenIds = state.hiddenIds
  setState({ ...state, overrides: {}, hiddenIds: [] })
  saveOverrides({})
  saveHiddenIds([])
  const ok = await syncFetch("jobs-reset", "POST")
  if (!ok) {
    setState({ ...state, overrides: prevOverrides, hiddenIds: prevHiddenIds })
    saveOverrides(prevOverrides)
    saveHiddenIds(prevHiddenIds)
  }
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
  const prevApplications = state.applications
  const applications = [app, ...state.applications]
  setState({ ...state, applications })
  saveApplications(applications)

  const workerUrl = (import.meta.env.VITE_RESUME_WORKER_URL || "").replace(/\/+$/, "")
  const resumeLink = app.resumeName && workerUrl ? `${workerUrl}/resumes/${app.id}` : ""
  syncFetch("apply", "POST", { ...app, resumeLink }).then((ok) => {
    if (!ok) {
      setState({ ...state, applications: prevApplications })
      saveApplications(prevApplications)
    }
  })

  return app
}

export async function deleteApplication(id: string) {
  const prevApplications = state.applications
  const prevNotes = state.notes
  const applications = state.applications.filter((a) => a.id !== id)
  const notes = state.notes.filter((n) => n.applicationId !== id)
  setState({ ...state, applications, notes })
  saveApplications(applications)
  saveNotes(notes)
  const ok = await syncFetch("application-delete", "POST", { id })
  if (!ok) {
    setState({ ...state, applications: prevApplications, notes: prevNotes })
    saveApplications(prevApplications)
    saveNotes(prevNotes)
  }
}

export async function clearApplications() {
  const prevApplications = state.applications
  const prevNotes = state.notes
  const ids = state.applications.map((a) => a.id)
  setState({ ...state, applications: [], notes: [] })
  saveApplications([])
  saveNotes([])
  if (ids.length > 0) {
    const ok = await syncFetch("application-delete", "POST", { ids })
    if (!ok) {
      setState({ ...state, applications: prevApplications, notes: prevNotes })
      saveApplications(prevApplications)
      saveNotes(prevNotes)
    }
  }
}

/** Move an application to a new pipeline stage, recording the transition in its timeline. */
export async function updateApplicationStage(id: string, stage: ApplicationStage) {
  const prevApplications = state.applications
  const applications = state.applications.map((a) =>
    a.id === id && a.stage !== stage
      ? { ...a, stage, stageHistory: [...a.stageHistory, { stage, at: new Date().toISOString() }] }
      : a,
  )
  setState({ ...state, applications })
  saveApplications(applications)

  const updated = applications.find((a) => a.id === id)
  if (updated) {
    const ok = await syncFetch("application-stage", "POST", { id, stage: updated.stage, stageHistory: updated.stageHistory })
    if (!ok) {
      setState({ ...state, applications: prevApplications })
      saveApplications(prevApplications)
    }
  }
}

export async function addNote(applicationId: string, text: string): Promise<Note> {
  const note: Note = { id: uid("note"), applicationId, text, createdAt: new Date().toISOString() }
  const prevNotes = state.notes
  const notes = [note, ...state.notes]
  setState({ ...state, notes })
  saveNotes(notes)
  const ok = await syncFetch("notes", "POST", note)
  if (!ok) {
    setState({ ...state, notes: prevNotes })
    saveNotes(prevNotes)
  }
  return note
}

export async function deleteNote(id: string) {
  const prevNotes = state.notes
  const notes = state.notes.filter((n) => n.id !== id)
  setState({ ...state, notes })
  saveNotes(notes)
  const ok = await syncFetch("notes", "DELETE", { id })
  if (!ok) {
    setState({ ...state, notes: prevNotes })
    saveNotes(prevNotes)
  }
}

// ---- Hooks ----

export function useCrmState(): CrmState {
  return useSyncExternalStore(subscribe, getState, getState)
}


export function useIsJobsLoading() {
  return useSyncExternalStore(subscribe, () => state.isJobsLoading)
}

export function useIsJobsLoadError() {
  return useSyncExternalStore(subscribe, () => state.jobsLoadError)
}

export function useIsAppsLoadError() {
  return useSyncExternalStore(subscribe, () => state.appsLoadError)
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
