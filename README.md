# IIDE Careers — shadcn/ui recreation

A local recreation of the IIDE careers page (https://careers.iide.co/jobs/Careers/) built with
**Vite + React + TypeScript + Tailwind + shadcn/ui**, seeded with the real 45 job openings.

The key change from the original: **clicking any job opens a local detail page (`/jobs/:id`) on
this site instead of redirecting to IIDE's Zoho Recruit account.** The "I'm interested" apply button
opens a local apply form whose submissions are saved to the built-in mini CRM (see below) — no external redirect.

## Routes
- `/` — hero + job list with search, department/location/type filters and sort
- `/jobs/:id` — local job detail page (full description + sticky apply sidebar + local apply dialog)
- `/admin` — mini CRM: add/edit/delete Job Descriptions and view applications (password: `admin123`)

## Run
```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Mini CRM (`/admin`)

A lightweight, browser-only CRM (data persisted in `localStorage`, no backend) for managing the
careers portal:

- **Job Descriptions tab** — add, edit and delete JDs. Added JDs appear on the public portal
  immediately (merged with the seeded catalogue). Seeded JDs are read-only.
- **Applications tab** — every submission from the public "I'm interested" form is listed here,
  with search, filter-by-job, a detail dialog, delete and CSV export.

Sign in with the demo password **`admin123`**. A discreet "Admin / CRM" link lives in the footer.

> Note: resume files are stored by name only (localStorage can't hold large files).

## Structure
```
src/
  data/jobs.ts            Job type + loader (reads jobs_data.json, decodes entities, helpers)
  data/jobs_data.json     Real 45 jobs (extracted from the live page)
  components/ui/*         shadcn/ui primitives (button, card, input, badge, label, select, dialog)
  components/*            Header, Hero, Footer, JobCard, JobDescription, ApplyDialog
                          + CRM: JdFormDialog, JobsManager, ApplicationsManager
  pages/HomePage.tsx      list view
  pages/JobDetailPage.tsx detail view (no redirect)
  pages/AdminPage.tsx     mini CRM shell (login gate + tabs)
  lib/storage.ts          CRM types + localStorage persistence
  lib/crm-store.ts        reactive store (useSyncExternalStore) + hooks + actions
  App.tsx, main.tsx       router + entry
```

## Theme
IIDE brand colors are wired into shadcn CSS variables in `src/index.css`:
`--primary: #0E69B3` (hsl 207 86% 38%), text `#171B27`, muted `#646d8c`, font Lato.
