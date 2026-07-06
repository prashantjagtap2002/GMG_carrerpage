import { useMemo, useSyncExternalStore } from "react"
import { seededJobs, type Job } from "@/data/jobs"
import {
  APPS_KEY,
  HIDDEN_KEY,
  JOBS_KEY,
  OVERRIDES_KEY,
  loadApplications,
  loadCustomJobs,
  loadHiddenIds,
  loadOverrides,
  saveApplications,
  saveCustomJobs,
  saveHiddenIds,
  saveOverrides,
  uid,
  type Application,
  type CustomJob,
  type JobOverride,
} from "@/lib/storage"

type CrmState = {
  customJobs: CustomJob[]
  /** Edits layered on top of seeded jobs, keyed by job id. */
  overrides: Record<string, JobOverride>
  /** Seeded job ids the admin has deleted. */
  hiddenIds: string[]
  applications: Application[]
}

let state: CrmState = {
  customJobs: loadCustomJobs(),
  overrides: loadOverrides(),
  hiddenIds: loadHiddenIds(),
  applications: loadApplications(),
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
    if (e.key === JOBS_KEY || e.key === APPS_KEY || e.key === OVERRIDES_KEY || e.key === HIDDEN_KEY) {
      state = {
        customJobs: loadCustomJobs(),
        overrides: loadOverrides(),
        hiddenIds: loadHiddenIds(),
        applications: loadApplications(),
      }
      emit()
    }
  })
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

export function addApplication(input: Omit<Application, "id" | "submittedAt">): Application {
  const app: Application = { ...input, id: uid("app"), submittedAt: new Date().toISOString() }
  const applications = [app, ...state.applications]
  setState({ ...state, applications })
  saveApplications(applications)
  return app
}

export function deleteApplication(id: string) {
  const applications = state.applications.filter((a) => a.id !== id)
  setState({ ...state, applications })
  saveApplications(applications)
}

export function clearApplications() {
  setState({ ...state, applications: [] })
  saveApplications([])
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
