import type { Job } from "@/data/jobs"

/** Hiring pipeline stage for an application. */
export type ApplicationStage =
  | "new"
  | "contacted"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"

export const DEFAULT_STAGE: ApplicationStage = "new"

/** A recorded stage transition, used to build the application's activity timeline. */
export type StageEvent = {
  stage: ApplicationStage
  at: string
}

/** A free-text note left on an application, shown in its activity timeline. */
export type Note = {
  id: string
  applicationId: string
  text: string
  createdAt: string
}

/**
 * A Job Description added through the CRM. Has the same shape as a seeded Job,
 * plus a creation timestamp so we can sort/admin them.
 */
export type CustomJob = Job & {
  createdAt: string
}

/**
 * An application submitted via the public "I'm interested" form.
 * Resume files are stored by name only (localStorage can't hold large files).
 */
export type Application = {
  id: string
  jobId: string
  jobTitle: string
  firstName: string
  lastName: string
  email: string
  company: string
  currentTitle: string
  country: string
  website: string
  source: string
  message: string
  resumeName: string
  submittedAt: string
  stage: ApplicationStage
  stageHistory: StageEvent[]
}

export const JOBS_KEY = "gmg-crm-jobs-v1"
export const APPS_KEY = "gmg-crm-applications-v1"
/** Edits applied on top of seeded (read-only catalogue) jobs, keyed by job id. */
export const OVERRIDES_KEY = "gmg-crm-overrides-v1"
/** Seeded job ids the admin has deleted (hidden from the portal). */
export const HIDDEN_KEY = "gmg-crm-hidden-v1"
/** Notes left on applications, keyed by applicationId. */
export const NOTES_KEY = "gmg-crm-notes-v1"

/** A partial patch applied to a seeded job when the admin edits it. */
export type JobOverride = Partial<Omit<Job, "id">>

/** Display name for an applicant, falling back to "-" if both name fields are empty. */
export function applicantName(a: Pick<Application, "firstName" | "lastName">): string {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || "-"
}

/** Small, reasonably-unique id generator (no external dep needed). */
export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / serialization errors in this demo store */
  }
}

export function loadCustomJobs(): CustomJob[] {
  return read<CustomJob[]>(JOBS_KEY, [])
}

export function saveCustomJobs(jobs: CustomJob[]): void {
  write(JOBS_KEY, jobs)
}

/** Fills in stage/stageHistory for applications saved before the pipeline feature existed. */
function normalizeApplication(a: Application): Application {
  const stage = a.stage ?? DEFAULT_STAGE
  const stageHistory =
    Array.isArray(a.stageHistory) && a.stageHistory.length > 0
      ? a.stageHistory
      : [{ stage, at: a.submittedAt }]
  return { ...a, stage, stageHistory }
}

export function loadApplications(): Application[] {
  return read<Application[]>(APPS_KEY, []).map(normalizeApplication)
}

export function saveApplications(apps: Application[]): void {
  write(APPS_KEY, apps)
}

export function loadNotes(): Note[] {
  return read<Note[]>(NOTES_KEY, [])
}

export function saveNotes(notes: Note[]): void {
  write(NOTES_KEY, notes)
}

export function loadOverrides(): Record<string, JobOverride> {
  return read<Record<string, JobOverride>>(OVERRIDES_KEY, {})
}

export function saveOverrides(overrides: Record<string, JobOverride>): void {
  write(OVERRIDES_KEY, overrides)
}

export function loadHiddenIds(): string[] {
  return read<string[]>(HIDDEN_KEY, [])
}

export function saveHiddenIds(ids: string[]): void {
  write(HIDDEN_KEY, ids)
}
