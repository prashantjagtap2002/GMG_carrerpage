import { Handler } from "@netlify/functions"
import { createClerkClient } from "@clerk/backend"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"

/**
 * Lets a signed-in admin manage who else can sign in to the CRM, without
 * leaving the app. Being a Clerk user for this instance is the entirety of
 * "admin access" here (AdminPage gates on <SignedIn>, no separate roles
 * table), so inviting/removing a Clerk user is inviting/removing an admin.
 */
function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured")
  return createClerkClient({ secretKey })
}

type MirrorUser = { id: string; email: string; name: string; createdAt: number }

/** Keeps the read-only `admin_users` Supabase table in step with Clerk's live user list. */
async function syncAdminUsersMirror(users: MirrorUser[]) {
  const supabase = getSupabase()
  if (users.length > 0) {
    const { error } = await supabase.from("admin_users").upsert(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || null,
        created_at: new Date(u.createdAt).toISOString(),
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "id" },
    )
    if (error) console.error("Failed to sync admin_users mirror:", error)
  }

  const { error: staleError } = await supabase
    .from("admin_users")
    .delete()
    .not("id", "in", `(${users.map((u) => `"${u.id}"`).join(",") || "''"})`)
  if (staleError) console.error("Failed to prune admin_users mirror:", staleError)
}

const handler: Handler = async (event) => {
  if (!(await isAuthed(event))) {
    return jsonResponse(401, { error: "Unauthorized" })
  }

  const clerkClient = getClerkClient()

  try {
    if (event.httpMethod === "GET") {
      const [{ data: users }, { data: invitations }] = await Promise.all([
        clerkClient.users.getUserList({ limit: 100 }),
        clerkClient.invitations.getInvitationList({ status: "pending", limit: 100 }),
      ])

      const mappedUsers = users.map((u) => ({
        id: u.id,
        email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "",
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        createdAt: u.createdAt,
      }))

      await syncAdminUsersMirror(mappedUsers)

      return jsonResponse(200, {
        users: mappedUsers,
        invitations: invitations.map((i) => ({
          id: i.id,
          emailAddress: i.emailAddress,
          status: i.status,
          createdAt: i.createdAt,
        })),
      })
    }

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}")
      const emailAddress = typeof data.emailAddress === "string" ? data.emailAddress.trim() : ""
      if (!emailAddress) return jsonResponse(400, { error: "Missing emailAddress" })

      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress,
        notify: true,
      })
      return jsonResponse(200, { invitation: { id: invitation.id, emailAddress: invitation.emailAddress } })
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body || "{}")
      const { type, id } = data as { type?: string; id?: string }
      if (!id || (type !== "user" && type !== "invitation")) {
        return jsonResponse(400, { error: "Missing or invalid type/id" })
      }

      if (type === "user") {
        await clerkClient.users.deleteUser(id)
        await getSupabase().from("admin_users").delete().eq("id", id)
      } else {
        await clerkClient.invitations.revokeInvitation(id)
      }
      return jsonResponse(200, { success: true })
    }

    return { statusCode: 405, body: "Method Not Allowed" }
  } catch (error) {
    console.error("Error in admin-users function:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
