/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clerk publishable key, used to sign in to the CRM at /admin (set in .env as VITE_CLERK_PUBLISHABLE_KEY). */
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  /** Cloudflare Worker base URL for resume storage (see /worker). Blank disables resume upload/preview. */
  readonly VITE_RESUME_WORKER_URL?: string
  /** Bearer token the Worker requires (must match its RESUME_ACCESS_TOKEN secret). */
  readonly VITE_RESUME_ACCESS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

