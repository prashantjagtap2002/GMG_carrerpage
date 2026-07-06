import { useState } from "react"
import { CheckCircle2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { type Job } from "@/data/jobs"
import { addApplication, useAllJobs } from "@/lib/crm-store"
import { saveResume } from "@/lib/resume-store"

const inputCls =
  "h-11 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/40 [color-scheme:dark] focus:border-gmg-gold focus:outline-none focus:ring-1 focus:ring-gmg-gold"
const labelCls = "mb-1.5 block text-sm font-semibold text-white"
// Native <option> elements render on the OS default (white) list background;
// force a dark background + light text so the text stays visible when open.
const optionCls = "bg-gmg-dark text-white"

const countries = [
  "India",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "Saudi Arabia",
  "Qatar",
  "Germany",
  "France",
  "Other",
]

const sources = [
  "LinkedIn",
  "Job Board (Naukri, Indeed, etc.)",
  "Company Website",
  "Referral",
  "Social Media",
  "Newspaper / Print",
  "Other",
]

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label} {required && <span className="text-gmg-red">*</span>}
      </label>
      {children}
    </div>
  )
}

/** Native select styled to match the dark form, with a custom chevron. */
function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputCls} appearance-none pr-9`}>
        {props.children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
    </div>
  )
}

export function ApplyDialog({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const allJobs = useAllJobs()
  const jobTitles = Array.from(new Set(allJobs.map((j) => j.title))).sort()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const data = new FormData(form)
    const applyingFor = String(data.get("applyingFor") || job.title)
    const matched = allJobs.find((j) => j.title === applyingFor)
    const fileInput = form.querySelector<HTMLInputElement>("#resume")
    const file = fileInput?.files?.[0]
    const created = addApplication({
      jobId: matched?.id ?? job.id,
      jobTitle: applyingFor,
      firstName: String(data.get("firstName") || ""),
      lastName: String(data.get("lastName") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      currentTitle: String(data.get("currentTitle") || ""),
      country: String(data.get("country") || ""),
      website: String(data.get("website") || ""),
      source: String(data.get("source") || ""),
      message: String(data.get("message") || ""),
      resumeName: file?.name ?? "",
    })
    // Persist the actual file bytes so the admin can view/download it later.
    if (file) void saveResume(created.id, file)
    setSubmitted(true)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSubmitted(false)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          I'm interested
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-gmg-dark text-white sm:max-w-[760px]">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-gmg-gold" />
            <h3 className="text-lg font-semibold">Application received!</h3>
            <p className="text-sm text-white/70">
              Thanks for your interest in{" "}
              <span className="font-medium text-white">{job.title}</span>. Your application has been
              recorded, and our recruitment team will reach out to you soon.
            </p>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl">I'm interested in {job.title}</DialogTitle>
              <DialogDescription className="text-white/60">
                Tell us a little about yourself. Your details are saved and shared with our
                recruitment team.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First Name" htmlFor="firstName">
                  <input id="firstName" name="firstName" placeholder="First Name" className={inputCls} />
                </Field>
                <Field label="Last Name" htmlFor="lastName">
                  <input id="lastName" name="lastName" placeholder="Last Name" className={inputCls} />
                </Field>

                <Field label="Work Email" required htmlFor="email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. name@company.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Company Name" required htmlFor="company">
                  <input id="company" name="company" required placeholder="e.g. GMG" className={inputCls} />
                </Field>

                <Field label="Current Job Title" htmlFor="currentTitle">
                  <input
                    id="currentTitle"
                    name="currentTitle"
                    placeholder="e.g. Sales Manager"
                    className={inputCls}
                  />
                </Field>
                <Field label="Job You're Applying For" required htmlFor="applyingFor">
                  <SelectField id="applyingFor" name="applyingFor" required defaultValue={job.title}>
                    {jobTitles.map((t) => (
                      <option key={t} value={t} className={optionCls}>
                        {t}
                      </option>
                    ))}
                  </SelectField>
                </Field>

                <Field label="Country" required htmlFor="country">
                  <SelectField id="country" name="country" required defaultValue="">
                    <option value="" disabled className={optionCls}>
                      Select Country
                    </option>
                    {countries.map((c) => (
                      <option key={c} value={c} className={optionCls}>
                        {c}
                      </option>
                    ))}
                  </SelectField>
                </Field>
                <Field label="Company Website (Optional)" htmlFor="website">
                  <input id="website" name="website" placeholder="e.g. www.gmg.com" className={inputCls} />
                </Field>
              </div>

              <Field label="How did you find GMG?" required htmlFor="source">
                <SelectField id="source" name="source" required defaultValue="">
                  <option value="" disabled className={optionCls}>
                    Select a source
                  </option>
                  {sources.map((s) => (
                    <option key={s} value={s} className={optionCls}>
                      {s}
                    </option>
                  ))}
                </SelectField>
              </Field>

              <Field label="Attach Resume (Optional)" htmlFor="resume">
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-gmg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black hover:file:bg-gmg-gold/90"
                />
                <p className="mt-1.5 text-xs text-white/40">PDF, DOC or DOCX. Max 5MB.</p>
              </Field>

              <Field label="Your Message" required htmlFor="message">
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="What would you like to ask or share?"
                  className={`${inputCls} h-auto resize-y py-3`}
                />
              </Field>

              <button
                type="submit"
                className="w-full rounded-md bg-gray-200 py-3 text-sm font-semibold text-black transition-colors hover:bg-white"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
