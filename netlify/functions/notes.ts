import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const MAX_NOTE_TEXT = 10000

const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      if (!data.applicationId) return jsonResponse(400, { error: "Missing applicationId" })
      if (!data.text || !String(data.text).trim()) return jsonResponse(400, { error: "Missing note text" })
      const text = String(data.text).slice(0, MAX_NOTE_TEXT)
      const { error } = await supabase.from("notes").insert({
        id: data.id,
        application_id: data.applicationId,
        text,
        created_at: data.createdAt,
      })
      if (error) throw error
      await logActivity({
        actor: await getActor(event),
        action: "note.create",
        entityType: "application",
        entityId: data.applicationId,
        summary: `Added a note: "${text.slice(0, 120)}"`,
      })
      return jsonResponse(201, { success: true })
    }

    if (event.httpMethod === "DELETE") {
      let id = event.queryStringParameters?.id
      if (!id) {
        try {
          const data = JSON.parse(event.body || "{}")
          id = data.id
        } catch {}
      }
      if (!id) return jsonResponse(400, { error: "Missing id" })
      const { data: deleted, error } = await supabase.from("notes").delete().eq("id", id).select("id")
      if (error) throw error
      if (deleted.length === 0) return jsonResponse(404, { error: "Note not found" })
      await logActivity({
        actor: await getActor(event),
        action: "note.delete",
        entityType: "application",
        summary: "Deleted a note",
      })
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(405, { error: "Method Not Allowed" })
  } catch (error) {
    console.error("Error handling note:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
