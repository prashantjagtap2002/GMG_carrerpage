import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Talks to Supabase over its HTTPS REST API (PostgREST), not a raw Postgres
 * connection. Supabase's direct DB host is IPv6-only, and Netlify Functions
 * (AWS Lambda) have no outbound IPv6 route, so a `pg` client there just hangs
 * until it times out. REST over HTTPS has no such restriction.
 */
let client: SupabaseClient | null = null

const FALLBACK_URL = "https://hhkrkehvtuzukwxxuoyo.supabase.co"
const FALLBACK_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa3JrZWh2dHV6dWt3eHh1b3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4NTA4NSwiZXhwIjoyMDk5MTYxMDg1fQ.qiDvoFIagsss0wzj84wSy_YcuHoQrN6BE0YuHoEqA9g"

export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || FALLBACK_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY
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
