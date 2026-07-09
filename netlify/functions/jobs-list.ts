import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"

// Public — the careers site lists jobs to every visitor, not just admins.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  try {
    const supabase = getSupabase()

    const [
      { data: customRows, error: customError },
      { data: overrideRows, error: overrideError },
      { data: hiddenRows, error: hiddenError },
    ] = await Promise.all([
      supabase.from("custom_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("job_overrides").select("*"),
      supabase.from("hidden_jobs").select("job_id"),
    ])

    if (customError) throw customError
    if (overrideError) throw overrideError
    if (hiddenError) throw hiddenError

    const customJobs = (customRows || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      department: r.department,
      city: r.city,
      state: r.state,
      country: r.country,
      jobType: r.job_type,
      experience: r.experience,
      dateOpened: r.date_opened,
      createdAt: r.created_at,
    }))

    const overrides: Record<string, unknown> = {}
    for (const r of overrideRows || []) overrides[r.job_id] = r.patch

    const hiddenIds = (hiddenRows || []).map((r) => r.job_id)

    return jsonResponse(200, { customJobs, overrides, hiddenIds })
  } catch (error) {
    console.error("Error listing jobs:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
