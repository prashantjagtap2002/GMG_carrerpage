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
    if (!data.id) return jsonResponse(400, { error: "Missing id" })

    const supabase = getSupabase()
    const { error } = await supabase
      .from("applications")
      .update({ stage: data.stage, stage_history: data.stageHistory || [] })
      .eq("id", data.id)

    if (error) throw error
    void logActivity({
      actor: await getActor(event),
      action: "application.stage_change",
      entityType: "application",
      entityId: data.id,
      summary: `Moved application to stage "${data.stage}"`,
    })
    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error updating application stage:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
