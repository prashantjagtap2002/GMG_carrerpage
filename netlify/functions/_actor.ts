import type { HandlerEvent } from "@netlify/functions"
import { verifyToken, createClerkClient } from "@clerk/backend"

export type Actor = { id: string; email: string | null; name: string | null }

/**
 * Resolves the signed-in admin behind a request, for attribution in the
 * activity log. Separate from `isAuthed` (which only needs a yes/no) because
 * this also looks up the user's email/name from Clerk.
 */
export async function getActor(event: HandlerEvent): Promise<Actor | null> {
  const header = event.headers.authorization || event.headers.Authorization
  if (!header?.startsWith("Bearer ")) return null
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return null
  try {
    const { sub } = await verifyToken(header.slice(7), { secretKey })
    const clerkClient = createClerkClient({ secretKey })
    const user = await clerkClient.users.getUser(sub)
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null
    return { id: sub, email, name }
  } catch {
    return null
  }
}
