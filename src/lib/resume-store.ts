/**
 * Résumé files are stored in Cloudflare R2 via the `gmg-resumes-worker`
 * Cloudflare Worker (see /worker), keyed by application id. The Application
 * record in localStorage only keeps the file name; this module talks to the
 * Worker for the actual bytes.
 *
 * If VITE_RESUME_WORKER_URL isn't configured, resume storage is a no-op —
 * uploads are silently skipped and lookups return undefined, so the rest of
 * the app keeps working (just without resume files).
 */

const WORKER_URL = (import.meta.env.VITE_RESUME_WORKER_URL || "").replace(/\/+$/, "")
const ACCESS_TOKEN = import.meta.env.VITE_RESUME_ACCESS_TOKEN || ""

export type StoredResume = { name: string; type: string; blob: Blob }

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${ACCESS_TOKEN}`, ...extra }
}

/** Persist a resume file under an application id. */
export async function saveResume(id: string, file: File): Promise<void> {
  if (!WORKER_URL) return
  try {
    const res = await fetch(`${WORKER_URL}/resumes/${id}`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": file.type || "application/octet-stream",
        "X-Resume-Name": encodeURIComponent(file.name),
      }),
      body: file,
    })
    if (!res.ok) console.error(`Failed to save resume ${id}: HTTP ${res.status}`)
  } catch (err) {
    console.error(`Failed to save resume ${id}:`, err)
  }
}

/** Fetch a stored resume, or undefined if none was saved for this application. */
export async function getResume(id: string): Promise<StoredResume | undefined> {
  if (!WORKER_URL) return undefined
  const res = await fetch(`${WORKER_URL}/resumes/${id}`, { headers: authHeaders() })
  if (!res.ok) return undefined
  const blob = await res.blob()
  const encodedName = res.headers.get("X-Resume-Name")
  return {
    name: encodedName ? decodeURIComponent(encodedName) : "resume",
    type: blob.type,
    blob,
  }
}

/** Remove a stored resume (called when its application is deleted). */
export async function deleteResume(id: string): Promise<void> {
  if (!WORKER_URL) return
  try {
    const res = await fetch(`${WORKER_URL}/resumes/${id}`, { method: "DELETE", headers: authHeaders() })
    if (!res.ok) console.error(`Failed to delete resume ${id}: HTTP ${res.status}`)
  } catch (err) {
    console.error(`Failed to delete resume ${id}:`, err)
  }
}
