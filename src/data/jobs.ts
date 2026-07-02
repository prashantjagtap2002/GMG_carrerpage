import rawJobs from "./jobs_data.json"

export type RawJob = {
  Posting_Title: string
  Job_Opening_Name: string
  Job_Description: string
  Industry: string
  City: string
  State: string
  Country: string
  Job_Type: string
  Work_Experience: string
  Date_Opened: string
  id: string
  Publish: boolean
}

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

function decodeEntities(s: string): string {
  if (!s) return s
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

export const jobs: Job[] = (rawJobs as RawJob[])
  .filter((j) => j.Publish !== false)
  .map((j) => ({
    id: j.id,
    title: decodeEntities(j.Job_Opening_Name || j.Posting_Title || "Untitled Role"),
    description: decodeEntities(j.Job_Description || ""),
    department: j.Industry || "General",
    city: j.City || "",
    state: j.State || "",
    country: j.Country || "",
    jobType: j.Job_Type || "Full time",
    experience: j.Work_Experience || "Not specified",
    dateOpened: j.Date_Opened || "",
  }))

export function getJobById(id: string): Job | undefined {
  return jobs.find((j) => j.id === id)
}

export const departments = Array.from(new Set(jobs.map((j) => j.department))).sort()
export const locations = Array.from(new Set(jobs.map((j) => j.city).filter(Boolean))).sort()
export const jobTypes = Array.from(new Set(jobs.map((j) => j.jobType).filter(Boolean))).sort()

export function locationString(job: Job): string {
  return [job.city, job.state, job.country].filter(Boolean).join(", ")
}

export function formatDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
