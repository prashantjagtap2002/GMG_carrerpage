import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { logActivity } from "./_log"

const MAX_APPS_PER_HOUR = 10

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  try {
    const data = JSON.parse(event.body || "{}")

    if (!data.email || !data.firstName || !data.lastName || !data.jobId || !data.jobTitle) {
      return jsonResponse(400, { error: "Missing required fields (email, firstName, lastName, jobId, jobTitle)" })
    }

    const email = String(data.email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(400, { error: "Invalid email" })
    }

    const supabase = getSupabase()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("submitted_at", oneHourAgo)
      .eq("email", email)
    if (countError) throw countError
    if (count != null && count >= MAX_APPS_PER_HOUR) {
      return jsonResponse(429, { error: "Too many applications. Please try again later." })
    }

    const { error } = await supabase.from("applications").insert({
      id: data.id,
      job_id: data.jobId,
      job_title: data.jobTitle,
      first_name: data.firstName,
      last_name: data.lastName,
      email,
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

    await logActivity({
      actor: { id: "public", email: data.email ?? null, name: [data.firstName, data.lastName].filter(Boolean).join(" ") || null },
      action: "application.create",
      entityType: "application",
      entityId: data.id,
      summary: `New application for "${data.jobTitle}"`,
    })

    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error inserting application:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
