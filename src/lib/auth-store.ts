import { useSyncExternalStore } from "react"

/**
 * Admin authentication for the GMG Careers CRM (/admin).
 *
 * This is a client-only app with no backend, so credentials live in two places:
 *   1. `.env` (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD) — the DEFAULT credentials
 *      baked into the build. Think of these as the factory defaults.
 *   2. `localStorage` — an optional override the admin sets from the CRM's
 *      "Settings" tab. When present, it takes precedence over the .env defaults.
 *
 * The signed-in state itself is kept in `sessionStorage`, so it clears when the
 * browser tab closes (same behaviour as the original password gate).
 */

/** Default credentials shipped with the build (overridable via .env). */
const ENV_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin"
const ENV_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123"

const CREDS_KEY = "gmg-crm-credentials-v1"
const AUTH_KEY = "gmg-crm-authed"

export type AdminCredentials = {
  username: string
  password: string
  /** ISO timestamp of the last credential change (null while still on .env defaults). */
  lastChangedAt: string | null
}

// ---- Signed-in session (sessionStorage) ----

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1"
  } catch {
    return false
  }
}

function setAuth(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(AUTH_KEY, "1")
    else sessionStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}

export function logout(): void {
  setAuth(false)
}

// ---- Credentials (localStorage override, else .env defaults) ----

function readStoredCredentials(): AdminCredentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AdminCredentials>
    if (typeof parsed.username === "string" && typeof parsed.password === "string") {
      return {
        username: parsed.username,
        password: parsed.password,
        lastChangedAt: typeof parsed.lastChangedAt === "string" ? parsed.lastChangedAt : null,
      }
    }
    return null
  } catch {
    return null
  }
}

function writeStoredCredentials(creds: AdminCredentials): void {
  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
  } catch {
    /* ignore quota / serialization errors */
  }
}

// Reactive store so the Settings UI reflects credential changes instantly.
let credentials: AdminCredentials =
  readStoredCredentials() ?? { username: ENV_USERNAME, password: ENV_PASSWORD, lastChangedAt: null }

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function getCredentialsSnapshot() {
  return credentials
}

// Keep multiple tabs in sync if credentials change elsewhere.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CREDS_KEY) {
      credentials =
        readStoredCredentials() ?? { username: ENV_USERNAME, password: ENV_PASSWORD, lastChangedAt: null }
      emit()
    }
  })
}

/** The currently effective admin credentials (override if present, else .env defaults). */
export function getCredentials(): AdminCredentials {
  return credentials
}

/**
 * Validate a username + password against the current credentials.
 * Starts a session on success. Returns true on success, false otherwise.
 */
export function login(username: string, password: string): boolean {
  const ok = username.trim() === credentials.username && password === credentials.password
  if (ok) setAuth(true)
  return ok
}

/**
 * Persist a new username + password (overrides the .env defaults in this browser).
 * Returns false if the new values are empty.
 */
export function updateCredentials(username: string, password: string): boolean {
  const next: AdminCredentials = {
    username: username.trim(),
    password,
    lastChangedAt: new Date().toISOString(),
  }
  if (!next.username || !next.password) return false
  credentials = next
  writeStoredCredentials(next)
  emit()
  
  // Update .env file locally via our custom Vite plugin (only works in local dev)
  fetch("/api/update-env", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: next.username, password: next.password })
  }).catch(() => { /* ignore */ })

  return true
}

/** Clear any stored override and go back to the .env defaults. */
export function resetCredentials(): void {
  try {
    localStorage.removeItem(CREDS_KEY)
  } catch {
    /* ignore */
  }
  credentials = { username: ENV_USERNAME, password: ENV_PASSWORD, lastChangedAt: null }
  emit()
}

// ---- Hooks ----

/** Reactively read the current admin credentials. */
export function useCredentials(): AdminCredentials {
  return useSyncExternalStore(subscribe, getCredentialsSnapshot, getCredentialsSnapshot)
}
