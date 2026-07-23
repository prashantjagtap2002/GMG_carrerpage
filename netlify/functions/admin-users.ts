import { Handler } from "@netlify/functions"
import { createClerkClient } from "@clerk/backend"
import { getSupabase, jsonResponse } from "./_supabase"
import { isAuthed } from "./_auth"
import { getActor } from "./_actor"
import { logActivity } from "./_log"

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
    .not("id", "in", `(${users.map((u) => `"${u.id.replace(/"/g, '""')}"`).join(",") || "''"})`)
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

      const usersNeedingRole = users.filter((u) => (u.publicMetadata as { role?: string } | undefined)?.role !== "admin")
      if (usersNeedingRole.length > 0) {
        await Promise.allSettled(
          usersNeedingRole.map((u) =>
            clerkClient.users.updateUser(u.id, { publicMetadata: { role: "admin" } }).catch(() => {})
          )
        )
      }

      const mappedUsers = users.map((u) => ({
        id: u.id,
        email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "",
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        createdAt: u.createdAt,
      }))

      await syncAdminUsersMirror(mappedUsers)

      return jsonResponse(200, {
        users: mappedUsers,
        invitations: (invitations ?? []).map((i) => ({
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
        return jsonResponse(400, { error: "Invalid email address" })
      }

      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress,
        notify: true,
      })
      await logActivity({
        actor: await getActor(event),
        action: "admin_user.invite",
        entityType: "admin_user",
        entityId: invitation.id,
        summary: `Invited ${emailAddress} as an admin`,
      })
      return jsonResponse(201, { invitation: { id: invitation.id, emailAddress: invitation.emailAddress } })
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body || "{}")
      const { type, id } = data as { type?: string; id?: string }
      if (!id || (type !== "user" && type !== "invitation")) {
        return jsonResponse(400, { error: "Missing or invalid type/id" })
      }

      const actor = await getActor(event)
      if (type === "user") {
        if (actor && id === actor.id) {
          return jsonResponse(400, { error: "Cannot remove yourself" })
        }

        const { data: users } = await clerkClient.users.getUserList({ limit: 100 })
        if (users.length <= 1) {
          return jsonResponse(400, { error: "Cannot remove the last admin" })
        }

        await clerkClient.users.deleteUser(id)
        await getSupabase().from("admin_users").delete().eq("id", id)
        await logActivity({
          actor,
          action: "admin_user.remove",
          entityType: "admin_user",
          entityId: id,
          summary: "Removed an admin's access",
        })
      } else {
        await clerkClient.invitations.revokeInvitation(id)
        await logActivity({
          actor,
          action: "admin_user.revoke_invite",
          entityType: "admin_user",
          entityId: id,
          summary: "Revoked a pending admin invitation",
        })
      }
      return jsonResponse(200, { success: true })
    }

    return jsonResponse(405, { error: "Method Not Allowed" })
  } catch (error) {
    console.error("Error in admin-users function:", error)
    return jsonResponse(500, { error: "Internal Server Error" })
  }
}

export { handler }
