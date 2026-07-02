import { useState } from "react"
import { CheckCircle2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Job } from "@/data/jobs"

export function ApplyDialog({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Local only — no external redirect or submit to IIDE/Zoho.
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
        <Button size="lg">I'm interested</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold">Application received!</h3>
            <p className="text-sm text-muted-foreground">
              Thanks for your interest in <span className="font-medium text-foreground">{job.title}</span>. This is a demo
              form — no data was sent anywhere.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>
                Fill in your details below. (Demo form — submitted locally, no redirect.)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Your name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91 ..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resume">Resume link</Label>
                <Input id="resume" placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                <Send className="h-4 w-4" /> Submit application
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
