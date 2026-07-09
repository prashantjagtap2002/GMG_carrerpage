import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
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
    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error updating application stage:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
