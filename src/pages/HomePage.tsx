import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JobCard } from "@/components/JobCard"
import { departments, jobs, jobTypes, locations } from "@/data/jobs"

const values = [
  {
    title: "Exploring New Horizons",
    desc: "We embrace new opportunities that inspire growth, innovation, and progress.",
  },
  {
    title: "Nurturing Talents",
    desc: "We invest in our people, helping every team member reach their full potential.",
  },
  {
    title: "Process with Tenacity",
    desc: "We pursue excellence with discipline, consistency, and a drive to deliver.",
  },
  {
    title: "Grandiose Experience",
    desc: "We create standout experiences for our customers and our teams alike.",
  },
]

export function HomePage() {
  const [query, setQuery] = useState("")
  const [dept, setDept] = useState("all")
  const [loc, setLoc] = useState("all")
  const [type, setType] = useState("all")
  const [sort, setSort] = useState("newest")

  const filtered = useMemo(() => {
    const list = jobs.filter((j) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q)
      const matchesDept = dept === "all" || j.department === dept
      const matchesLoc = loc === "all" || j.city === loc
      const matchesType = type === "all" || j.jobType === type
      return matchesQuery && matchesDept && matchesLoc && matchesType
    })
    return [...list].sort((a, b) => {
      const da = new Date(a.dateOpened).getTime() || 0
      const db = new Date(b.dateOpened).getTime() || 0
      if (sort === "newest") return db - da
      if (sort === "oldest") return da - db
      if (sort === "title") return a.title.localeCompare(b.title)
      return 0
    })
  }, [query, dept, loc, type, sort])

  return (
    <main id="jobs">
      <section className="border-b bg-gmg-black text-white">
        <div className="container py-14">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-gmg-gold">
              Life at GMG
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Why join Gautam Modi Group</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/70">
              A culture built on ambition and care — where talented people grow alongside a group of
              industry-leading automotive brands.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-gmg-gold/50"
              >
                <h3 className="text-base font-semibold text-gmg-gold">{v.title}</h3>
                <p className="mt-2 text-sm text-white/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-secondary/40">
        <div className="container py-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Open positions</h2>
          <p className="mt-2 text-muted-foreground">
            Find your next role and apply directly — no redirects.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs by title or department..."
              className="pl-9"
            />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {jobTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} open {filtered.length === 1 ? "role" : "roles"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center">
            <p className="text-lg font-medium">No jobs match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing some filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
