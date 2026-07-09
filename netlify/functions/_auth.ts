import type { HandlerEvent } from "@netlify/functions"
import { verifyToken } from "@clerk/backend"

/**
 * Verifies the Clerk session token on the `Authorization: Bearer <token>`
 * header. Used to gate admin-only mutations (job/application writes) so the
 * API itself is protected, not just hidden behind the CRM's login screen.
 */
export async function isAuthed(event: HandlerEvent): Promise<boolean> {
  const header = event.headers.authorization || event.headers.Authorization
  if (!header?.startsWith("Bearer ")) return false
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return false
  try {
    await verifyToken(header.slice(7), { secretKey })
    return true
  } catch {
    return false
  }
}
