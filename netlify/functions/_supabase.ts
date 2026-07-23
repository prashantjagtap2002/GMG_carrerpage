import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Talks to Supabase over its HTTPS REST API (PostgREST), not a raw Postgres
 * connection. Supabase's direct DB host is IPv6-only, and Netlify Functions
 * (AWS Lambda) have no outbound IPv6 route, so a `pg` client there just hangs
 * until it times out. REST over HTTPS has no such restriction.
 */
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured")
  }
  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    body: JSON.stringify(body),
  }
}
