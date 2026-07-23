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

const MAX_LABEL = 100
const MAX_COLOR = 50

const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    if (event.httpMethod === "GET") {
      await supabase.from("pipeline_stages").upsert(DEFAULT_STAGES, { onConflict: "id", ignoreDuplicates: true })
      const { data, error } = await supabase.from("pipeline_stages").select("*").order("sort_order")
      if (error) throw error
      return jsonResponse(200, { stages: data })
    }

    const actor = await getActor(event)

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id || !data.label) return jsonResponse(400, { error: "Missing id/label" })
      if (!String(data.label).trim()) return jsonResponse(400, { error: "Label must not be empty" })
      const { error } = await supabase.from("pipeline_stages").insert({
        id: data.id,
        label: String(data.label).slice(0, MAX_LABEL),
        color: String(data.color ?? "bg-blue-500").slice(0, MAX_COLOR),
        sort_order: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      })
      if (error) throw error
      await logActivity({
        actor,
        action: "pipeline_stage.create",
        entityType: "pipeline_stage",
        entityId: data.id,
        summary: `Added pipeline stage "${data.label}"`,
      })
      return jsonResponse(201, { success: true })
    }

    if (event.httpMethod === "PATCH") {
      const data = JSON.parse(event.body || "{}")
      if (!data.id) return jsonResponse(400, { error: "Missing id" })
      const patch = data.patch || {}
      const update: Record<string, unknown> = {}
      if ("label" in patch) update.label = String(patch.label).slice(0, MAX_LABEL)
      if ("color" in patch) update.color = String(patch.color).slice(0, MAX_COLOR)
      const { error } = await supabase.from("pipeline_stages").update(update).eq("id", data.id)
      if (error) throw error
      await logActivity({
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
      const { data: deleted, error } = await supabase.from("pipeline_stages").delete().eq("id", data.id).select("id")
      if (error) throw error
      if (deleted.length === 0) return jsonResponse(404, { error: "Stage not found" })
      await logActivity({
        actor,
        action: "pipeline_stage.delete",
        entityType: "pipeline_stage",
        entityId: data.id,
        summary: `Deleted pipeline stage "${data.label ?? data.id}"`,
      })
      return jsonResponse(200, { success: true })
    }

    if (event.httpMethod === "PUT") {
      const data = JSON.parse(event.body || "{}")
      const ids: string[] = Array.isArray(data.ids) ? data.ids : []
      if (ids.length === 0) return jsonResponse(400, { error: "Missing ids" })
      for (const id of ids) {
        if (typeof id !== "string" || !id.trim()) {
          return jsonResponse(400, { error: "Invalid stage id in list" })
        }
      }
      for (const [index, id] of ids.entries()) {
        const { error } = await supabase.from("pipeline_stages").update({ sort_order: index }).eq("id", id)
        if (error) throw error
      }
      await logActivity({
        actor,
        action: "pipeline_stage.reorder",
        entityType: "pipeline_stage",
        summary: "Reordered pipeline stages",
      })
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(405, { error: "Method Not Allowed" })
  } catch (error) {
    console.error("Error handling pipeline stage:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
