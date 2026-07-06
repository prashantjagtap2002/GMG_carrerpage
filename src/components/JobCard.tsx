import { Link } from "react-router-dom"
import { Briefcase, Building2, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate, locationString, type Job } from "@/data/jobs"

export function JobCard({ job }: { job: Job }) {
  return (
    <Card className="group flex flex-col gap-4 p-5 transition-all hover:border-primary/40 hover:shadow-md md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <Link
          to={`/jobs/${job.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
        >
          {job.title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{job.department}</Badge>
          <Badge variant="outline">{job.jobType}</Badge>
          {job.dateOpened && (
            <span className="text-xs text-muted-foreground">Posted {formatDate(job.dateOpened)}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* LOCAL route: opens the job detail in a new tab, no redirect to IIDE/Zoho */}
        <Button asChild>
          <Link to={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">
            I'm interested
          </Link>
        </Button>
      </div>
    </Card>
  )
}
