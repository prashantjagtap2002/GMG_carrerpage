import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/RichTextEditor"
import { useAllJobs } from "@/lib/crm-store"
import type { Job } from "@/data/jobs"

export type JdFormValues = {
  title: string
  department: string
  city: string
  state: string
  country: string
  jobType: string
  experience: string
  dateOpened: string
  description: string
}

const JOB_TYPES = ["Full time", "Part time", "Contract", "Internship", "Temporary"]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyValues(): JdFormValues {
  return {
    title: "",
    department: "",
    city: "",
    state: "",
    country: "India",
    jobType: "Full time",
    experience: "",
    dateOpened: todayISO(),
    description: "",
  }
}

function htmlIsEmpty(html: string): boolean {
  return !html.replace(/<[^>]*>/g, "").trim()
}

function fromJob(job: Job): JdFormValues {
  return {
    title: job.title,
    department: job.department,
    city: job.city,
    state: job.state,
    country: job.country,
    jobType: job.jobType,
    experience: job.experience,
    dateOpened: job.dateOpened ? job.dateOpened.slice(0, 10) : todayISO(),
    description: job.description,
  }
}
export function JdFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (values: JdFormValues) => void
  initial?: Job | null
}) {
  const [values, setValues] = useState<JdFormValues>(emptyValues())
  const allJobs = useAllJobs()
  const departments = Array.from(new Set(allJobs.map((j) => j.department).filter(Boolean))).sort()

  useEffect(() => {
    if (!open) return
    setValues(initial ? fromJob(initial) : emptyValues())
  }, [open, initial])

  function set<K extends keyof JdFormValues>(key: K, val: JdFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || htmlIsEmpty(values.description)) return
    onSubmit({
      ...values,
      title: values.title.trim(),
      department: values.department.trim() || "General",
      city: values.city.trim(),
      state: values.state.trim(),
      country: values.country.trim(),
      experience: values.experience.trim() || "Not specified",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Job Description" : "Add Job Description"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details for this role."
              : "Create a new role. It will appear on the careers portal immediately."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="jd-title">Job Title *</Label>
            <Input
              id="jd-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Sales Consultant"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jd-dept">Department</Label>
              <Input
                id="jd-dept"
                list="jd-depts"
                value={values.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="e.g. Sales"
              />
              <datalist id="jd-depts">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-type">Job Type</Label>
              <Select value={values.jobType} onValueChange={(v) => set("jobType", v)}>
                <SelectTrigger id="jd-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-city">City</Label>
              <Input
                id="jd-city"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-state">State</Label>
              <Input
                id="jd-state"
                value={values.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-country">Country</Label>
              <Input
                id="jd-country"
                value={values.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="e.g. India"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-exp">Experience</Label>
              <Input
                id="jd-exp"
                value={values.experience}
                onChange={(e) => set("experience", e.target.value)}
                placeholder="e.g. 3-5 years"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-date">Date Opened</Label>
              <Input
                id="jd-date"
                type="date"
                value={values.dateOpened}
                onChange={(e) => set("dateOpened", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-desc">Job Description *</Label>
            <RichTextEditor
              value={values.description}
              onChange={(html) => set("description", html)}
              placeholder="Write the full job description here..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initial ? "Save changes" : "Add job"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

