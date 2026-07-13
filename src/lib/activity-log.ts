import { fetchJSON } from "@/lib/crm-store"

export type ActivityLogEntry = {
  id: string
  actor_email: string | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  summary: string
  created_at: string
}

/** Recent CRM activity (job/application/note/stage/pipeline/admin-user changes), newest first. */
export async function listActivityLog(): Promise<ActivityLogEntry[]> {
  const body = await fetchJSON<{ entries: ActivityLogEntry[] }>("activity-log")
  return body?.entries ?? []
}
