import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

const DEFAULT_STAGES = [
  { id: "new", label: "New", color: "bg-slate-400", sort_order: 0 },
  { id: "contacted", label: "Contacted", color: "bg-blue-500", sort_order: 1 },
  { id: "qualified", label: "Qualified", color: "bg-amber-500", sort_order: 2 },
  { id: "proposal", label: "Proposal", color: "bg-violet-500", sort_order: 3 },
  { id: "won", label: "Won", color: "bg-green-500", sort_order: 4 },
  { id: "lost", label: "Lost", color: "bg-red-500", sort_order: 5 },
]

// Admin-only: shared hiring pipeline stages, backed by Supabase so every
// admin sees the same board instead of a per-browser localStorage copy.
const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === "GET") {
      // First run: seed the defaults so there's always something to show.
      await supabase.from("pipeline_stages").upsert(DEFAULT_STAGES, { onConflict: "id", ignoreDuplicates: true })
      const { data, error } = await supabase.from("pipeline_stages").select("*").order("sort_order")
      if (error) throw error
      return jsonResponse(200, { stages: data })
    }

    const actor = await getActor(event)

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id || !data.label) return jsonResponse(400, { error: "Missing id/label" })
      const { error } = await supabase.from("pipeline_stages").insert({
        id: data.id,
        label: data.label,
        color: data.color,
        sort_order: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      })
      if (error) throw error
      void logActivity({
        actor,
        action: "pipeline_stage.create",
        entityType: "pipeline_stage",
        entityId: data.id,
        summary: `Added pipeline stage "${data.label}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "PATCH") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const patch = data.patch || {}
      const update: Record<string, unknown> = {}
      if ("label" in patch) update.label = patch.label
      if ("color" in patch) update.color = patch.color
      const { error } = await supabase.from("pipeline_stages").update(update).eq("id", data.id)
      if (error) throw error
      void logActivity({
        actor,
        action: "pipeline_stage.update",
        entityType: "pipeline_stage",
        entityId: data.id,
        summary: `Updated pipeline stage "${patch.label ?? data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const { error } = await supabase.from("pipeline_stages").delete().eq("id", data.id)
      if (error) throw error
      void logActivity({
        actor,
        action: "pipeline_stage.delete",
        entityType: "pipeline_stage",
        entityId: data.id,
        summary: `Deleted pipeline stage "${data.label ?? data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "PUT") {
      // Reorder: body is the full list of stage ids in their new order.
      const data = JSON.parse(event.body || "{}")
      const ids: string[] = Array.isArray(data.ids) ? data.ids : []
      if (ids.length === 0) return jsonResponse(400, { error: "Missing ids" })
      const results = await Promise.all(
        ids.map((id, index) => supabase.from("pipeline_stages").update({ sort_order: index }).eq("id", id)),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
      void logActivity({
        actor,
        action: "pipeline_stage.reorder",
        entityType: "pipeline_stage",
        summary: "Reordered pipeline stages",
      })
      return jsonResponse(200, { success: true })
    }

    return { statusCode: 405, body: "Method Not Allowed" }
  } catch (error) {
    console.error("Error handling pipeline stage:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
