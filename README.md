# GMG Careers — Careers Portal + Admin CRM

A careers portal for Gautam Modi Group built with **Vite + React + TypeScript + Tailwind + shadcn/ui**.
Features a public-facing job board and a private admin CRM with application tracking, pipeline management, and Clerk-based authentication.

## Routes

- `/` — hero + job list with search, department/location/type filters and sort
- `/jobs/:id` — job detail page with full description
- `/jobs/:id/apply` — public application form
- `/admin` — mini CRM (Clerk-authenticated): Jobs, Applications, Settings

## Run

```bash
npm install
npm run dev          # start dev server (http://localhost:5173)
npm run build        # type-check + production build
npm run preview      # preview the production build
npm run lint         # ESLint check
npm run format       # Prettier format
npm run typecheck    # TypeScript check only
```

## Environment

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (client-safe) |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side only) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `VITE_RESUME_WORKER_URL` | Cloudflare Worker for resume uploads |
| `VITE_RESUME_ACCESS_TOKEN` | Worker access token |

## Mini CRM (`/admin`)

Auth is handled by **Clerk** with restricted (invite-only) sign-up and role-based access control.

- **Jobs tab** — add, edit, delete job descriptions synced to Supabase
- **Applications tab** — view, search, filter, CSV export, and stage applications
- **Settings tab** — pipeline stage editor, admin user management (invite/remove via Clerk API), activity log, account settings

## Architecture

```
src/
  pages/                  Route-level components
  components/             Shared UI components + CRM managers
  components/ui/          shadcn/ui primitives
  lib/                    Stores (crm-store, pipeline, admin-users, toast) + utilities
  data/jobs.ts            Job type + helpers

netlify/functions/        Serverless backend (Supabase + Clerk)
  _auth.ts                Clerk session token verification
  _supabase.ts            Supabase client + CORS helper
  _log.ts                 Activity logging
  apply.ts                Public application submission
  jobs-*.ts               Job CRUD operations
  applications-*.ts       Application operations
  pipeline-stages.ts      Pipeline stage management
  admin-users.ts          Clerk user/invitation management
  notes.ts                Application notes
  activity-log.ts         Activity log retrieval

scripts/                  Build helpers + setup SQL
```
