import { getAuthToken, FN_BASE } from "@/lib/crm-store"

export type AdminUser = {
  id: string
  email: string
  name: string
  createdAt: number
}

export type AdminInvitation = {
  id: string
  emailAddress: string
  status: string
  createdAt: number
}

async function authedFetch<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = await getAuthToken()
  const res = await fetch(`${FN_BASE}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${path} responded ${res.status}`)
  return (await res.json()) as T
}

export function listAdminUsers() {
  return authedFetch<{ users: AdminUser[]; invitations: AdminInvitation[] }>("admin-users", "GET")
}

export function inviteAdminUser(emailAddress: string) {
  return authedFetch<{ invitation: { id: string; emailAddress: string } }>("admin-users", "POST", {
    emailAddress,
  })
}

export function removeAdminUser(id: string) {
  return authedFetch<{ success: true }>("admin-users", "DELETE", { type: "user", id })
}

export function revokeAdminInvitation(id: string) {
  return authedFetch<{ success: true }>("admin-users", "DELETE", { type: "invitation", id })
}
