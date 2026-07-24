import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const MAX_TITLE = 255
const MAX_TEXT = 10000

function truncate(val: unknown, max: number): string {
  return String(val ?? "").slice(0, max)
}

const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()
    const actor = await getActor(event)

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      if (!data.title || !String(data.title).trim()) {
        return jsonResponse(400, { error: "Missing required field: title" })
      }
      const { error } = await supabase.from("custom_jobs").insert({
        id: data.id,
        title: truncate(data.title, MAX_TITLE),
        description: truncate(data.description, MAX_TEXT),
        department: truncate(data.department, MAX_TITLE),
        city: truncate(data.city, MAX_TITLE),
        state: truncate(data.state, MAX_TITLE),
        country: truncate(data.country, MAX_TITLE),
        job_type: truncate(data.jobType, MAX_TITLE),
        experience: truncate(data.experience, MAX_TITLE),
        date_opened: data.dateOpened,
        created_at: data.createdAt,
      })
      if (error) throw error
      await logActivity({
        actor,
        action: "job.create",
        entityType: "job",
        entityId: data.id,
        summary: `Created job "${truncate(data.title, 120)}"`,
      })
      return jsonResponse(201, { success: true })
    }

    if (event.httpMethod === "PATCH") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const patch = data.patch || {}
      const update: Record<string, unknown> = {}
      if ("title" in patch) update.title = truncate(patch.title, MAX_TITLE)
      if ("description" in patch) update.description = truncate(patch.description, MAX_TEXT)
      if ("department" in patch) update.department = truncate(patch.department, MAX_TITLE)
      if ("city" in patch) update.city = truncate(patch.city, MAX_TITLE)
      if ("state" in patch) update.state = truncate(patch.state, MAX_TITLE)
      if ("country" in patch) update.country = truncate(patch.country, MAX_TITLE)
      if ("jobType" in patch) update.job_type = truncate(patch.jobType, MAX_TITLE)
      if ("experience" in patch) update.experience = truncate(patch.experience, MAX_TITLE)
      if ("dateOpened" in patch) update.date_opened = patch.dateOpened

      const { error } = await supabase.from("custom_jobs").update(update).eq("id", data.id)
      if (error) throw error
      await logActivity({
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

      // Delete associated notes and applications first to avoid foreign key
      // constraint violations (applications.job_id -> custom_jobs.id).
      const { data: linkedApps } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", data.id)
      if (linkedApps && linkedApps.length > 0) {
        const appIds = linkedApps.map((a: { id: string }) => a.id)
        await supabase.from("notes").delete().in("application_id", appIds)
        await supabase.from("applications").delete().eq("job_id", data.id)
      }

      const { data: deleted, error } = await supabase.from("custom_jobs").delete().eq("id", data.id).select("id")
      if (error) throw error
      if (deleted.length === 0) return jsonResponse(404, { error: "Job not found" })
      await logActivity({
        actor,
        action: "job.delete",
        entityType: "job",
        entityId: data.id,
        summary: `Deleted job "${data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(405, { error: "Method Not Allowed" })
  } catch (error) {
    console.error("Error handling custom job:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
