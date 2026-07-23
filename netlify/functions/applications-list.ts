import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"

const MAX_RESULTS = 500

const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  try {
    const supabase = getSupabase()

    const [{ data: appRows, error: appError }, { data: noteRows, error: noteError }] = await Promise.all([
      supabase.from("applications").select("*").order("submitted_at", { ascending: false }).limit(MAX_RESULTS),
      supabase.from("notes").select("*").order("created_at", { ascending: false }),
    ])

    if (appError) throw appError
    if (noteError) throw noteError

    const applications = (appRows || []).map((r) => ({
      id: r.id,
      jobId: r.job_id,
      jobTitle: r.job_title,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      company: r.company,
      currentTitle: r.current_title,
      country: r.country,
      website: r.website,
      source: r.source,
      message: r.message,
      resumeName: r.resume_name,
      submittedAt: r.submitted_at,
      stage: r.stage,
      stageHistory: r.stage_history || [],
    }))

    const notes = (noteRows || []).map((n) => ({
      id: n.id,
      applicationId: n.application_id,
      text: n.text,
      createdAt: n.created_at,
    }))

    return jsonResponse(200, { applications, notes })
  } catch (error) {
    console.error("Error listing applications:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
