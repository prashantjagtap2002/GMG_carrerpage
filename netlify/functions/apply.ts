import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"
import { logActivity } from "./_log"

const MAX_APPS_PER_HOUR = 10
const MAX_FIELD_LENGTH = 500
const VALID_SOURCES = new Set(["careers", "linkedin", "indeed", "referral", "other"])

function truncate(val: unknown): string {
  return String(val ?? "").slice(0, MAX_FIELD_LENGTH)
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" })
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

    const source = VALID_SOURCES.has(data.source) ? data.source : "careers"

    const { error } = await supabase.from("applications").insert({
      id: data.id,
      job_id: data.jobId,
      job_title: truncate(data.jobTitle),
      first_name: truncate(data.firstName),
      last_name: truncate(data.lastName),
      email,
      company: truncate(data.company),
      current_title: truncate(data.currentTitle),
      country: truncate(data.country),
      website: truncate(data.website),
      source,
      message: truncate(data.message),
      resume_name: truncate(data.resumeName),
      resume_link: truncate(data.resumeLink),
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

    return jsonResponse(201, { success: true })
  } catch (error) {
    console.error("Error inserting application:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
