# IIDE Careers — shadcn/ui recreation

A local recreation of the IIDE careers page (https://careers.iide.co/jobs/Careers/) built with
**Vite + React + TypeScript + Tailwind + shadcn/ui**, seeded with the real 45 job openings.

The key change from the original: **clicking any job opens a local detail page (`/jobs/:id`) on
this site instead of redirecting to IIDE's Zoho Recruit account.** The "I'm interested" apply button
opens a local demo dialog form — no external redirect.

## Routes
- `/` — hero + job list with search, department/location/type filters and sort
- `/jobs/:id` — local job detail page (full description + sticky apply sidebar + local apply dialog)

## Run
```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Structure
```
src/
  data/jobs.ts            Job type + loader (reads jobs_data.json, decodes entities, helpers)
  data/jobs_data.json     Real 45 jobs (extracted from the live page)
  components/ui/*         shadcn/ui primitives (button, card, input, badge, label, select, dialog)
  components/*            Header, Hero, Footer, JobCard, JobDescription, ApplyDialog
  pages/HomePage.tsx      list view
  pages/JobDetailPage.tsx detail view (no redirect)
  App.tsx, main.tsx       router + entry
```

## Theme
IIDE brand colors are wired into shadcn CSS variables in `src/index.css`:
`--primary: #0E69B3` (hsl 207 86% 38%), text `#171B27`, muted `#646d8c`, font Lato.
