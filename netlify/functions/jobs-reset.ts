import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"

// Admin-only: undo all seeded-job edits/deletions, restoring the original catalogue.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()
    const [{ error: overrideError }, { error: hiddenError }] = await Promise.all([
      supabase.from("job_overrides").delete().not("job_id", "is", null),
      supabase.from("hidden_jobs").delete().not("job_id", "is", null),
    ])
    if (overrideError) throw overrideError
    if (hiddenError) throw hiddenError
    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error resetting job customizations:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
