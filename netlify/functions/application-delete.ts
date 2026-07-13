import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const data = JSON.parse(event.body || "{}")
    const supabase = getSupabase()
    const actor = await getActor(event)

    if (Array.isArray(data.ids)) {
      if (data.ids.length === 0) return jsonResponse(200, { success: true })
      const { error } = await supabase.from("applications").delete().in("id", data.ids)
      if (error) throw error
      void logActivity({
        actor,
        action: "application.delete",
        entityType: "application",
        summary: `Deleted ${data.ids.length} applications`,
      })
    } else if (data.id) {
      const { error } = await supabase.from("applications").delete().eq("id", data.id)
      if (error) throw error
      void logActivity({
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
