import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

// Admin-only: create/edit/delete a CRM-added job description.
const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()
    const actor = await getActor(event)

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      const { error } = await supabase.from("custom_jobs").insert({
        id: data.id,
        title: data.title,
        description: data.description,
        department: data.department,
        city: data.city,
        state: data.state,
        country: data.country,
        job_type: data.jobType,
        experience: data.experience,
        date_opened: data.dateOpened,
        created_at: data.createdAt,
      })
      if (error) throw error
      void logActivity({
        actor,
        action: "job.create",
        entityType: "job",
        entityId: data.id,
        summary: `Created job "${data.title}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "PATCH") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const patch = data.patch || {}
      const update: Record<string, unknown> = {}
      if ("title" in patch) update.title = patch.title
      if ("description" in patch) update.description = patch.description
      if ("department" in patch) update.department = patch.department
      if ("city" in patch) update.city = patch.city
      if ("state" in patch) update.state = patch.state
      if ("country" in patch) update.country = patch.country
      if ("jobType" in patch) update.job_type = patch.jobType
      if ("experience" in patch) update.experience = patch.experience
      if ("dateOpened" in patch) update.date_opened = patch.dateOpened

      const { error } = await supabase.from("custom_jobs").update(update).eq("id", data.id)
      if (error) throw error
      void logActivity({
        actor,
        action: "job.update",
        entityType: "job",
        entityId: data.id,
        summary: `Updated job "${patch.title ?? data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const { error } = await supabase.from("custom_jobs").delete().eq("id", data.id)
      if (error) throw error
      void logActivity({
        actor,
        action: "job.delete",
        entityType: "job",
        entityId: data.id,
        summary: `Deleted job "${data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    return { statusCode: 405, body: "Method Not Allowed" }
  } catch (error) {
    console.error("Error handling custom job:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
