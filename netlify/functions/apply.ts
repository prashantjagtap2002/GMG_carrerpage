import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  try {
    const data = JSON.parse(event.body || "{}")
    const supabase = getSupabase()

    const { error } = await supabase.from("applications").insert({
      id: data.id,
      job_id: data.jobId,
      job_title: data.jobTitle,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      company: data.company,
      current_title: data.currentTitle,
      country: data.country,
      website: data.website,
      source: data.source,
      message: data.message,
      resume_name: data.resumeName,
      resume_link: data.resumeLink,
      submitted_at: data.submittedAt,
      stage: data.stage || "new",
      stage_history: data.stageHistory || [],
    })

    if (error) throw error

    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error inserting application:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
