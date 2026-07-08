import { useNavigate } from "react-router-dom"
import { Briefcase, Building2, Clock, MapPin, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatDate, locationString, type Job } from "@/data/jobs"

export function JobCard({ job }: { job: Job }) {
  const navigate = useNavigate()
  const href = `/jobs/${job.id}`

  // The whole card is clickable: clicking anywhere navigates to the job
  // detail page. We also support keyboard activation (Enter/Space) for
  // accessibility, since the card itself is the interactive surface.
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      navigate(href)
    }
  }

  return (
    <Card
      tabIndex={0}
      role="link"
      onClick={() => navigate(href)}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer flex-col gap-4 p-5 outline-none transition-all hover:border-gmg-gold/50 hover:shadow-[0_0_24px_rgba(255,180,0,0.07)] focus-visible:border-gmg-gold/50 focus-visible:shadow-[0_0_24px_rgba(255,180,0,0.07)] md:flex-row md:items-center md:justify-between"
    >
      <div className="space-y-2">
        {/* Short accent line, echoing the GMG homepage card motif */}
        <span className="block h-0.5 w-7 rounded-full bg-gmg-gold/80 transition-all group-hover:w-10 group-hover:bg-gmg-gold" />
        <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {job.title}
        </h3>
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
      {/* Visual CTA hinting the whole card is clickable. The arrow nudges on
          hover to reinforce that the entire box is the target. */}
      <div className="flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-primary md:self-center">
        I'm interested
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Card>
  )
}
