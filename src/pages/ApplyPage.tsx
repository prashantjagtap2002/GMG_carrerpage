import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft, ArrowRight, Briefcase, Building2, CheckCircle2, ChevronDown, Clock,
  FileText, Globe, Link2, Mail, MapPin, Megaphone, Target, UploadCloud, User, X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { locationString, type Job } from "@/data/jobs"
import { addApplication, useAllJobs, useJobById } from "@/lib/crm-store"
import { saveResume } from "@/lib/resume-store"

const inputCls =
  "h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-10 pr-3.5 text-sm text-white placeholder:text-white/30 [color-scheme:dark] transition-all duration-150 focus:border-gmg-gold/60 focus:bg-gmg-gold/[0.03] focus:outline-none focus:ring-[3px] focus:ring-gmg-gold/15"
const labelCls = "mb-2 block text-[13px] font-semibold text-white/80"
const optionCls = "bg-gmg-dark text-white"

const countries = ["India", "United Arab Emirates", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Saudi Arabia", "Qatar", "Germany", "France", "Other"]
const sources = ["LinkedIn", "Job Board (Naukri, Indeed, etc.)", "Company Website", "Referral", "Social Media", "Newspaper / Print", "Other"]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Field({ label, required, htmlFor, icon, className, children }: {
  label: string
  required?: boolean
  htmlFor?: string
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("group", className)}>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-gmg-gold">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-gmg-gold [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <>
      <select {...props} className={`${inputCls} cursor-pointer appearance-none pr-10`}>{props.children}</select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </>
  )
}

function Section({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
        {step}
      </div>
      <h2 className="text-xl font-medium text-white">{title}</h2>
    </div>
  )
}

/** The application form body. Contains the field set and the submission/save
    logic. Renders only the form itself — the page wrapper provides the layout. */
function ApplyForm({ job, onSubmitted }: { job: Job; onSubmitted: () => void }) {
  const [resume, setResume] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const allJobs = useAllJobs()
  const jobTitles = Array.from(new Set(allJobs.map((j) => j.title))).sort()

  function acceptFile(f: File | undefined | null) {
    if (!f) return
    if (!/\.(pdf|docx?)$/i.test(f.name)) return
    setResume(f)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const data = new FormData(form)
    const applyingFor = String(data.get("applyingFor") || job.title)
    const matched = allJobs.find((j) => j.title === applyingFor)
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
      resumeName: resume?.name ?? "",
    })
    if (resume) void saveResume(created.id, resume)
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-4">
        <Section step={1} title="About you" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" htmlFor="firstName" icon={<User />}>
            <input id="firstName" name="firstName" placeholder="First name" className={inputCls} />
          </Field>
          <Field label="Last Name" htmlFor="lastName" icon={<User />}>
            <input id="lastName" name="lastName" placeholder="Last name" className={inputCls} />
          </Field>
          <Field label="Work Email" required htmlFor="email" icon={<Mail />}>
            <input id="email" name="email" type="email" required placeholder="name@company.com" className={inputCls} />
          </Field>
          <Field label="Country" required htmlFor="country" icon={<Globe />}>
            <SelectField id="country" name="country" required defaultValue="">
              <option value="" disabled className={optionCls}>Select country</option>
              {countries.map((c) => (<option key={c} value={c} className={optionCls}>{c}</option>))}
            </SelectField>
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <Section step={2} title="Professional background" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" required htmlFor="company" icon={<Building2 />}>
            <input id="company" name="company" required placeholder="e.g. GMG" className={inputCls} />
          </Field>
          <Field label="Current Job Title" htmlFor="currentTitle" icon={<Briefcase />}>
            <input id="currentTitle" name="currentTitle" placeholder="e.g. Sales Manager" className={inputCls} />
          </Field>
          <Field label="Company Website (Optional)" htmlFor="website" icon={<Link2 />} className="sm:col-span-2">
            <input id="website" name="website" placeholder="e.g. www.gmg.com" className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <Section step={3} title="Your application" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job You're Applying For" required htmlFor="applyingFor" icon={<Target />}>
            <SelectField id="applyingFor" name="applyingFor" required defaultValue={job.title}>
              {jobTitles.map((t) => (<option key={t} value={t} className={optionCls}>{t}</option>))}
            </SelectField>
          </Field>
          <Field label="How did you find GMG?" required htmlFor="source" icon={<Megaphone />}>
            <SelectField id="source" name="source" required defaultValue="">
              <option value="" disabled className={optionCls}>Select a source</option>
              {sources.map((s) => (<option key={s} value={s} className={optionCls}>{s}</option>))}
            </SelectField>
          </Field>
        </div>

        <div>
          <span className={labelCls}>Attach Resume (Optional)</span>
          {resume ? (
            <div className="flex items-center gap-3 rounded-lg border border-gmg-gold/30 bg-gmg-gold/[0.06] px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-gmg-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{resume.name}</p>
                <p className="text-xs text-white/40">{formatSize(resume.size)}</p>
              </div>
              <button
                type="button"
                aria-label="Remove attached resume"
                onClick={() => { setResume(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="resume"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0]) }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center transition-colors",
                dragOver ? "border-gmg-gold/70 bg-gmg-gold/[0.06]" : "border-white/15 bg-white/[0.02] hover:border-gmg-gold/40 hover:bg-white/[0.04]"
              )}
            >
              <UploadCloud className={cn("h-6 w-6", dragOver ? "text-gmg-gold" : "text-white/35")} />
              <p className="text-sm text-white/70">
                <span className="font-semibold text-gmg-gold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-white/35">PDF, DOC or DOCX · up to 5 MB</p>
              <input ref={fileInputRef} id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => acceptFile(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <Field label="Your Message" required htmlFor="message">
          <textarea id="message" name="message" required rows={4} placeholder="What would you like to ask or share?" className={`${inputCls} h-auto resize-y py-3 pl-3.5`} />
        </Field>
      </div>

      <div className="space-y-3 pt-1">
        <button type="submit" className="group/submit flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gmg-gold text-sm font-bold text-black transition-all hover:bg-[#ffc233] hover:shadow-[0_0_28px_rgba(255,180,0,0.25)]">
          Submit application
          <ArrowRight className="h-4 w-4 transition-transform group-hover/submit:translate-x-0.5" />
        </button>
        <p className="text-center text-xs text-white/35">Your details are only shared with the GMG recruitment team.</p>
      </div>
    </form>
  )
}

/** Full-page application form — a two-column layout matching the GMG apply
    page design: a sticky job summary on the left, the application form on the
    right, all on the dark GMG canvas. */
export function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const job = useJobById(id)
  const [submitted, setSubmitted] = useState(false)

  if (!job) {
    return (
      <main className="bg-gmg-dark py-24 text-center text-white">
        <div className="container">
          <h1 className="text-2xl font-bold">Job not found</h1>
          <p className="mt-2 text-white/60">This role may have been closed or removed.</p>
          <Button asChild className="mt-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to all jobs
            </Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gmg-dark text-white">
      <div className="container py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 text-white/70 hover:bg-white/5 hover:text-white">
          <Link to={`/jobs/${job.id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to job details
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Left column — sticky job summary */}
          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div>
              <span className="block h-1 w-12 rounded-full bg-gmg-gold" />
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gmg-gold">Job application</p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight md:text-3xl">{job.title}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
                {job.department && (
                  <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{job.department}</span>
                )}
                {job.city && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.city}{job.country ? `, ${job.country}` : ""}</span>
                )}
                {job.jobType && (
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{job.jobType}</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold text-white/70">Role overview</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/40">Department</dt>
                  <dd className="text-right font-medium text-white">{job.department}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/40">Location</dt>
                  <dd className="text-right font-medium text-white">{locationString(job)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/40">Type</dt>
                  <dd className="text-right font-medium text-white">{job.jobType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/40">Experience</dt>
                  <dd className="text-right font-medium text-white">{job.experience}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">{job.department}</Badge>
                <Badge variant="outline">{job.jobType}</Badge>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-white/40">
              Think this role is a fit? Fill in the form and our recruitment team will reach out to you soon.
            </p>
          </aside>

          {/* Right column — the application form */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center duration-300 animate-in fade-in zoom-in-95">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gmg-gold/10 ring-1 ring-gmg-gold/40">
                  <CheckCircle2 className="h-8 w-8 text-gmg-gold" />
                </div>
                <h2 className="text-xl font-bold">Application received!</h2>
                <p className="max-w-sm text-sm leading-relaxed text-white/60">
                  Thanks for your interest in{" "}
                  <span className="font-medium text-white">{job.title}</span>. Your application
                  has been recorded, and our recruitment team will reach out to you soon.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link to={`/jobs/${job.id}`}>Back to job details</Link>
                  </Button>
                  <Button variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white" onClick={() => setSubmitted(false)}>
                    Submit another application
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold">Apply for this role</h2>
                <p className="mt-1.5 text-sm text-white/50">
                  Tell us a little about yourself. Your details are saved and shared with our recruitment team.
                </p>
                <div className="mt-6">
                  <ApplyForm job={job} onSubmitted={() => setSubmitted(true)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
