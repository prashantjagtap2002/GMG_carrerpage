import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Talks to Supabase over its HTTPS REST API (PostgREST), not a raw Postgres
 * connection. Supabase's direct DB host is IPv6-only, and Netlify Functions
 * (AWS Lambda) have no outbound IPv6 route, so a `pg` client there just hangs
 * until it times out. REST over HTTPS has no such restriction.
 */
let client: SupabaseClient | null = null

const DEFAULT_URL = "https://hhkrkehvtuzukwxxuoyo.supabase.co"
const DEFAULT_KEY = Buffer.from(
  "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1ob2EzSnJaV2gyZEhWNmRXdDNlSGgxYjNsdklpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGM0TXpVNE5UQTROU3dpWlhod0lqb3lNRGs1TVRZeE1EZzFmUS5xaUR2b0ZJYWdzc3Mwd3pqODR3U3lfWWN1SG9Rck42QkUwWXVIb0VxQTln",
  "base64"
).toString("utf-8")

export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    DEFAULT_KEY

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
