import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      const { error } = await supabase.from("notes").insert({
        id: data.id,
        application_id: data.applicationId,
        text: data.text,
        created_at: data.createdAt,
      })
      if (error) throw error
      void logActivity({
        actor: await getActor(event),
        action: "note.create",
        entityType: "application",
        entityId: data.applicationId,
        summary: `Added a note: "${String(data.text || "").slice(0, 120)}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const { error } = await supabase.from("notes").delete().eq("id", data.id)
      if (error) throw error
      void logActivity({
        actor: await getActor(event),
        action: "note.delete",
        entityType: "application",
        summary: "Deleted a note",
      })
      return jsonResponse(200, { success: true })
    }

    return { statusCode: 405, body: "Method Not Allowed" }
  } catch (error) {
    console.error("Error handling note:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
