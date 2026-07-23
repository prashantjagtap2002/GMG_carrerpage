import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const data = JSON.parse(event.body || "{}")
    if (!data.id) return jsonResponse(400, { error: "Missing id" })
    if (!data.stage || !String(data.stage).trim()) return jsonResponse(400, { error: "Missing stage" })

    const supabase = getSupabase()
    const update: Record<string, unknown> = { stage: String(data.stage).slice(0, 100) }
    if (data.stageHistory !== undefined) update.stage_history = data.stageHistory
    const { error } = await supabase
      .from("applications")
      .update(update)
      .eq("id", data.id)

    if (error) throw error
    await logActivity({
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
