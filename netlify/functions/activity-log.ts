import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"

// Admin-only: recent CRM activity (job/application/note/stage/pipeline/
// admin-user changes), most recent first.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    return jsonResponse(200, { entries: data })
  } catch (error) {
    console.error("Error listing activity log:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
