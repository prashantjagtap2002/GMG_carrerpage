export type Job = {
  id: string
  title: string
  description: string
  department: string
  city: string
  state: string
  country: string
  jobType: string
  experience: string
  dateOpened: string
}

/**
 * Job descriptions now live entirely in Supabase (custom_jobs table, synced
 * via crm-store's refreshJobs/composeJobs) — the catalogue that used to be
 * bundled here from jobs_data.json was migrated there directly. This stays
 * empty so composeJobs' seeded-job merge is a no-op.
 */
export const seededJobs: Job[] = []

export function toTitleCase(str: string): string {
  if (!str) return ""
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function locationString(job: Job): string {
  return [job.city, job.state, job.country]
    .filter(Boolean)
    .map(toTitleCase)
    .join(", ")
}

export function formatDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function formatExperience(exp: string): string {
  if (!exp || exp === "Not specified") return exp
  const trimmed = exp.trim()
  if (/[a-zA-Z]/.test(trimmed)) return trimmed
  if (trimmed === "1") return "1 year"
  return `${trimmed} years`
}
