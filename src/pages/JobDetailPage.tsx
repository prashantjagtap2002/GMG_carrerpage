import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Briefcase, Building2, Clock, MapPin, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApplyDialog } from "@/components/ApplyDialog"
import { JobDescription } from "@/components/JobDescription"
import { formatDate, locationString } from "@/data/jobs"
import { useJobById } from "@/lib/crm-store"

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const job = useJobById(id)

  if (!job) {
    return (
      <main className="container py-24 text-center">
        <h1 className="text-2xl font-bold">Job not found</h1>
        <p className="mt-2 text-muted-foreground">This role may have been closed or removed.</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Back to all jobs
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="bg-secondary/30">
      <div className="container py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Back to all jobs
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  {/* Short accent line, echoing the GMG homepage card motif */}
                  <span className="block h-0.5 w-8 rounded-full bg-gmg-gold" />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{job.department}</Badge>
                    <Badge variant="outline">{job.jobType}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {locationString(job)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" /> {job.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> {job.jobType}
                    </span>
                    {job.experience && job.experience !== "Not specified" && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {job.experience}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Job description</h2>
              <JobDescription text={job.description} />
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground">Overview</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Department</dt>
                  <dd className="text-right font-medium">{job.department}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-right font-medium">{locationString(job)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="text-right font-medium">{job.jobType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd className="text-right font-medium">{job.experience}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Posted</dt>
                  <dd className="text-right font-medium">{formatDate(job.dateOpened)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground">Apply now</h3>
              <p className="mt-2 text-sm text-muted-foreground">Think this role is a fit? Apply directly here.</p>
              <div className="mt-4">
                <ApplyDialog job={job} />
              </div>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: job.title, url: window.location.href }).catch(() => {})
                  } else {
                    navigator.clipboard?.writeText(window.location.href)
                  }
                }}
              >
                <Share2 className="h-4 w-4" /> Share this role
              </Button>
            </Card>

            <Button asChild variant="ghost" className="w-full">
              <Link to="/">View all open roles</Link>
            </Button>
          </aside>
        </div>
      </div>
    </main>
  )
}
