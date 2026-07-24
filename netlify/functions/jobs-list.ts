import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"

// Public — the careers site lists jobs to every visitor, not just admins.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method Not Allowed" })
  }

  try {
    const supabase = getSupabase()

    const [
      { data: customRows, error: customError },
      { data: overrideRows, error: overrideError },
      { data: hiddenRows, error: hiddenError },
    ] = await Promise.all([
      supabase.from("custom_jobs").select("*"),
      supabase.from("job_overrides").select("*"),
      supabase.from("hidden_jobs").select("job_id"),
    ])

    if (customError) {
      console.error("custom_jobs fetch error:", customError)
      throw customError
    }
    if (overrideError) {
      console.warn("job_overrides fetch error (ignored):", overrideError)
    }
    if (hiddenError) {
      console.warn("hidden_jobs fetch error (ignored):", hiddenError)
    }

    const customJobs = (customRows || [])
      .map((r) => ({
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
        createdAt: r.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

    const overrides: Record<string, unknown> = {}
    for (const r of overrideRows || []) overrides[r.job_id] = r.patch

    const hiddenIds = (hiddenRows || []).map((r) => r.job_id)

    return jsonResponse(200, { customJobs, overrides, hiddenIds })
  } catch (error) {
    console.error("Error listing jobs:", error)
    const msg = error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error)
    return jsonResponse(500, { error: msg })
  }
}

export { handler }
