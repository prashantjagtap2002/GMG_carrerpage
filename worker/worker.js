/**
 * Cloudflare Worker that proxies resume uploads/downloads to the "gmg-resumes"
 * R2 bucket. Files are stored under Resume/<applicationId>.
 *
 * Access control: GET (viewing a resume) is public — the `resume_link` saved
 * in Supabase and the CRM's "View resume" button both rely on that, and
 * application ids are unguessable, so this is "unlisted", not indexed or
 * enumerable, not truly private. PUT/DELETE (uploading/removing a resume)
 * still require `Authorization: Bearer <token>` matching the
 * RESUME_ACCESS_TOKEN secret, so random visitors can't overwrite or delete
 * files. Set RESUME_ACCESS_TOKEN with:
 *   wrangler secret put RESUME_ACCESS_TOKEN
 */

const KEY_PATTERN = /^\/resumes\/([A-Za-z0-9_.-]+)$/

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Resume-Name",
    "Access-Control-Expose-Headers": "X-Resume-Name, Content-Type, Content-Length",
    "Vary": "Origin",
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get("Origin") || "*"
    const headers = corsHeaders(origin)

    if (request.method === "OPTIONS") {
      return new Response(null, { headers })
    }

    const match = KEY_PATTERN.exec(url.pathname)
    if (!match) {
      return new Response("Not found", { status: 404, headers })
    }
    const key = `Resume/${match[1]}`

    if (request.method === "GET") {
      const obj = await env.RESUMES.get(key)
      if (!obj) return new Response("Not found", { status: 404, headers })
      const resHeaders = new Headers(headers)
      obj.writeHttpMetadata(resHeaders)
      resHeaders.set("X-Resume-Name", obj.customMetadata?.name || "")
      return new Response(obj.body, { headers: resHeaders })
    }

    // Uploading/deleting still requires the token — only viewing is public.
    if (!env.RESUME_ACCESS_TOKEN || request.headers.get("Authorization") !== `Bearer ${env.RESUME_ACCESS_TOKEN}`) {
      return new Response("Unauthorized", { status: 401, headers })
    }

    if (request.method === "PUT") {
      const filename = request.headers.get("X-Resume-Name") || match[1]
      const contentType = request.headers.get("Content-Type") || "application/octet-stream"
      await env.RESUMES.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: { name: filename },
      })
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    }

    if (request.method === "DELETE") {
      await env.RESUMES.delete(key)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    }

    return new Response("Method not allowed", { status: 405, headers })
  },
}
