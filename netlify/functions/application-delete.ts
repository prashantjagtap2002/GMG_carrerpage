import { Handler } from "@netlify/functions"
import { getSupabase, jsonResponse } from "./_supabase"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  try {
    const data = JSON.parse(event.body || "{}")
    const supabase = getSupabase()

    if (Array.isArray(data.ids)) {
      if (data.ids.length === 0) return jsonResponse(200, { success: true })
      const { error } = await supabase.from("applications").delete().in("id", data.ids)
      if (error) throw error
    } else if (data.id) {
      const { error } = await supabase.from("applications").delete().eq("id", data.id)
      if (error) throw error
    } else {
      return jsonResponse(400, { error: "Missing id/ids" })
    }

    return jsonResponse(200, { success: true })
  } catch (error) {
    console.error("Error deleting application(s):", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
