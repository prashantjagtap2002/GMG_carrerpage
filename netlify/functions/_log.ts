import { getSupabase } from "./_supabase"
import type { Actor } from "./_actor"

/**
 * Records one row in `activity_log`. Best-effort: a logging failure must
 * never fail the mutation it's describing, so errors are swallowed (and
 * only console-logged) rather than thrown.
 */
export async function logActivity(params: {
  actor: Actor | null
  action: string
  entityType: string
  entityId?: string | null
  summary: string
}) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("activity_log").insert({
      id: `log-${crypto.randomUUID()}`,
      actor_email: params.actor?.email ?? null,
      actor_name: params.actor?.name ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      summary: params.summary,
    })
    if (error) console.error("Failed to log activity:", error)
  } catch (err) {
    console.error("Failed to log activity:", err)
  }
}
