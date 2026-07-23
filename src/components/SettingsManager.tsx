import { useEffect, useState } from "react"
import { Plus, Trash2, GripVertical, History, Mail, UserCog, UserPlus, Users } from "lucide-react"
import { UserProfile } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePipelineStore } from "@/lib/pipeline"
import { listActivityLog, type ActivityLogEntry } from "@/lib/activity-log"
import {
  listAdminUsers,
  inviteAdminUser,
  removeAdminUser,
  revokeAdminInvitation,
  type AdminUser,
  type AdminInvitation,
} from "@/lib/admin-users"

/**
 * CRM "Settings" tab. Sign-in and account management (email, password, etc.)
 * are handled by Clerk — this tab embeds Clerk's own account UI plus the
 * pipeline stage editor, which Clerk has no concept of.
 *
 * Layout mirrors the other CRM managers: a header row, then full-width
 * section cards, so width stays consistent with the Jobs/Applications tabs.
 */
export function SettingsManager() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account and the hiring pipeline for this CRM.
          </p>
        </div>
      </div>

      <PipelineSettingsSection />
      <AdminUsersSection />
      <ActivityLogSection />
      <AccountSection />
    </div>
  )
}

/* Admin Users - invite/remove who can sign in to the CRM (Clerk-backed). */

function AdminUsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)
  const [removePin, setRemovePin] = useState("")
  const [enteredPin, setEnteredPin] = useState("")

  async function refresh() {
    try {
      const data = await listAdminUsers()
      setUsers(data.users)
      setInvitations(data.invitations)
    } catch {
      setError("Couldn't load admin users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    setError(null)
    try {
      await inviteAdminUser(email.trim())
      setEmail("")
      await refresh()
    } catch {
      setError("Couldn't send invite. Check the email address and try again.")
    } finally {
      setInviting(false)
    }
  }

  function initiateRemove(id: string) {
    setRemoveConfirmId(id)
    setRemovePin(Math.floor(1000 + Math.random() * 9000).toString())
    setEnteredPin("")
  }

  async function confirmRemove(e: React.FormEvent) {
    e.preventDefault()
    if (enteredPin !== removePin || !removeConfirmId) return
    try {
      await removeAdminUser(removeConfirmId)
      setRemoveConfirmId(null)
      await refresh()
    } catch {
      setError("Couldn't remove admin. Please try again.")
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeAdminInvitation(id)
      await refresh()
    } catch {
      setError("Couldn't revoke invitation. Please try again.")
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gmg-gold/10 text-gmg-gold">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold">Admin Users</h3>
          <p className="text-sm text-muted-foreground">
            Invite teammates to sign in to this CRM, or remove their access.
          </p>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={inviting || !email.trim()}>
            <UserPlus className="h-4 w-4 mr-2" />
            {inviting ? "Inviting…" : "Invite"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current admins
              </h4>
              <ul className="space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-md border p-3 bg-card"
                  >
                    <div>
                      <div className="font-medium">{u.name || u.email}</div>
                      {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => initiateRemove(u.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {users.length === 0 && (
                  <li className="text-sm text-muted-foreground">No admins yet.</li>
                )}
              </ul>
            </div>

            {invitations.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pending invitations
                </h4>
                <ul className="space-y-2">
                  {invitations.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between rounded-md border p-3 bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{i.emailAddress}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(i.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Revoke
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {removeConfirmId && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Are you sure you want to remove this admin's access?
            </p>
            <p className="text-sm mb-4">
              To confirm, type this PIN: <strong className="select-none">{removePin}</strong>
            </p>
            <form onSubmit={confirmRemove} className="flex gap-2">
              <Input
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-32"
                autoFocus
              />
              <Button type="submit" variant="destructive" disabled={enteredPin !== removePin}>
                Remove
              </Button>
              <Button type="button" variant="outline" onClick={() => setRemoveConfirmId(null)}>
                Cancel
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}

/* Activity Log - audit trail of CRM changes (jobs, applications, notes, stages, admin users). */

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function ActivityLogSection() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setEntries(await listActivityLog())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gmg-gold/10 text-gmg-gold">
            <History className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Activity Log</h3>
            <p className="text-sm text-muted-foreground">
              Recent changes made across the CRM, most recent first.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </header>

      <div className="p-4 sm:p-6">
        {loading && entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 rounded-md border p-3 bg-card">
                <div>
                  <div className="text-sm font-medium">{e.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.actor_name || e.actor_email || "Unknown"}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground" title={new Date(e.created_at).toLocaleString()}>
                  {timeAgo(e.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/* Account section - Clerk's own account management UI (email, password, sessions). */

function AccountSection() {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gmg-gold/10 text-gmg-gold">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold">Account &amp; Security</h3>
          <p className="text-sm text-muted-foreground">Update your sign-in details, managed by Clerk.</p>
        </div>
      </header>
      <div className="overflow-x-auto p-5">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full mx-auto",
              cardBox: "w-full max-w-full shadow-none",
            },
          }}
        />
      </div>
    </section>
  )
}

/* Pipeline Settings - manage customizable stages */

function PipelineSettingsSection() {
  const { stages, addStage, deleteStage, reorderStages } = usePipelineStore()
  const [newStageName, setNewStageName] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletePin, setDeletePin] = useState("")
  const [enteredPin, setEnteredPin] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragEnter(index: number) {
    if (draggedIndex === null) return
    setDragOverIndex(index)
  }

  function handleDragEnd() {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderStages(draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newStageName.trim()) return
    addStage({ label: newStageName.trim(), color: "bg-blue-500" })
    setNewStageName("")
  }

  function initiateDelete(id: string) {
    setDeleteConfirmId(id)
    setDeletePin(Math.floor(1000 + Math.random() * 9000).toString())
    setEnteredPin("")
  }

  function confirmDelete(e: React.FormEvent) {
    e.preventDefault()
    if (enteredPin === deletePin && deleteConfirmId) {
      deleteStage(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Pipeline Stages</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the stages of your hiring pipeline.
        </p>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <ul className="space-y-2">
          {stages.map((stage, i) => (
            <li 
              key={stage.id} 
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center justify-between rounded-md border p-3 transition-colors cursor-move bg-card ${
                draggedIndex === i ? "opacity-50" : ""
              } ${
                dragOverIndex === i && draggedIndex !== null && draggedIndex !== i
                  ? dragOverIndex > draggedIndex
                    ? "border-b-2 border-b-primary"
                    : "border-t-2 border-t-primary"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-50" />
                <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="font-medium">{stage.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => initiateDelete(stage.id)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {deleteConfirmId && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Are you sure you want to delete this stage forever?
            </p>
            <p className="text-sm mb-4">
              To confirm, type this PIN: <strong className="select-none">{deletePin}</strong>
            </p>
            <form onSubmit={confirmDelete} className="flex gap-2">
              <Input
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-32"
                autoFocus
              />
              <Button type="submit" variant="destructive" disabled={enteredPin !== deletePin}>
                Delete
              </Button>
              <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
            </form>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2 pt-2">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="New stage name..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </form>
      </div>
    </section>
  )
}

