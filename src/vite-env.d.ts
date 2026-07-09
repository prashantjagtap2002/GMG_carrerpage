/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default admin username for the CRM (set in .env as VITE_ADMIN_USERNAME). */
  readonly VITE_ADMIN_USERNAME?: string
  /** Default admin password for the CRM (set in .env as VITE_ADMIN_PASSWORD). */
  readonly VITE_ADMIN_PASSWORD?: string
  /** Cloudflare Worker base URL for resume storage (see /worker). Blank disables resume upload/preview. */
  readonly VITE_RESUME_WORKER_URL?: string
  /** Bearer token the Worker requires (must match its RESUME_ACCESS_TOKEN secret). */
  readonly VITE_RESUME_ACCESS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

