import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const MAX_BATCH_DELETE = 100

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const data = JSON.parse(event.body || "{}")
    const supabase = getSupabase()
    const actor = await getActor(event)

    if (Array.isArray(data.ids)) {
      if (data.ids.length === 0) return jsonResponse(400, { error: "Missing ids" })
      if (data.ids.length > MAX_BATCH_DELETE) {
        return jsonResponse(400, { error: `Cannot delete more than ${MAX_BATCH_DELETE} applications at once` })
      }
      const validIds = data.ids.filter((id: unknown) => typeof id === "string" && id.trim())
      if (validIds.length === 0) return jsonResponse(400, { error: "No valid application IDs" })
      const { data: deleted, error } = await supabase.from("applications").delete().in("id", validIds).select("id")
      if (error) throw error
      if (deleted.length === 0) return jsonResponse(404, { error: "No applications found" })
      await logActivity({
        actor,
        action: "application.delete",
        entityType: "application",
        summary: `Deleted ${deleted.length} applications`,
      })
    } else if (data.id) {
      const { data: deleted, error } = await supabase.from("applications").delete().eq("id", data.id).select("id")
      if (error) throw error
      if (deleted.length === 0) return jsonResponse(404, { error: "Application not found" })
      await logActivity({
        actor,
        action: "application.delete",
        entityType: "application",
        entityId: data.id,
        summary: "Deleted an application",
      })
    } else {
      return jsonResponse(400, { error: "Missing id/ids" })
    }

    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error deleting application(s):", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
