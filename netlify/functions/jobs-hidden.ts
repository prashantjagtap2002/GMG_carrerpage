import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

// Admin-only: hide/unhide a seeded job from the public portal.
const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === "PUT") {
      const data = JSON.parse(event.body || "{}")
      if (!data.jobId) return jsonResponse(400, { error: "Missing jobId" })
      const { error } = await supabase.from("hidden_jobs").upsert({ job_id: data.jobId })
      if (error) throw error
      await logActivity({
        actor: await getActor(event),
        action: "job.delete",
        entityType: "job",
        entityId: data.jobId,
        summary: `Hid seeded job "${data.jobId}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "DELETE") {
      let jobId = event.queryStringParameters?.jobId
      if (!jobId) {
        try {
          const data = JSON.parse(event.body || "{}")
          jobId = data.jobId
        } catch {}
      }
      if (!jobId) return jsonResponse(400, { error: "Missing jobId" })
      const { error } = await supabase.from("hidden_jobs").delete().eq("job_id", jobId)
      if (error) throw error
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(405, { error: "Method Not Allowed" })
  } catch (error) {
    console.error("Error handling hidden job:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
