import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  UserCog,
  Trash2,
  Plus,
  GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  updateCredentials,
  useCredentials,
} from "@/lib/auth-store"
import { usePipelineStore } from "@/lib/pipeline"



/** 0-4 strength score from a candidate password (length + variety). */
function passwordScore(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"]
const STRENGTH_COLORS = ["bg-muted", "bg-gmg-red", "bg-amber-500", "bg-lime-500", "bg-emerald-500"]

/**
 * CRM "Settings" tab. Lets the signed-in admin change the username and password
 * used to sign in to /admin. New credentials are saved in the browser
 * (localStorage) and override the defaults from the .env file.
 *
 * Layout mirrors the other CRM managers: a header row, then a two-pane body:
 * a slim section nav on the left and the active section's card(s) on the right.
 */
export function SettingsManager() {

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your admin sign-in credentials for this CRM.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <PipelineSettingsSection />
        <CredentialsSection />
      </div>
    </div>
  )
}

/* Credentials section - change admin username and password. */

function CredentialsSection() {
  const current = useCredentials()
  const [username, setUsername] = useState(current.username)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const score = passwordScore(newPassword)

  // Keep the field in sync if creds change elsewhere (e.g. reset to defaults).
  useMemo(() => setUsername(current.username), [current.username])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const nextUsername = username.trim()
    
    if (!nextUsername) {
      setMessage({ type: "error", text: "Username cannot be empty." })
      return
    }
    
    if (currentPassword !== current.password) {
      setMessage({ type: "error", text: "Current password is incorrect." })
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." })
      return
    }

    if (nextUsername === current.username && !newPassword) {
      setMessage({ type: "error", text: "No changes to save." })
      return
    }

    const finalPassword = newPassword || current.password
    updateCredentials(nextUsername, finalPassword)
    setMessage({ type: "success", text: "Credentials updated successfully." })
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gmg-gold/10 text-gmg-gold">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold">Account &amp; Security</h3>
          <p className="text-sm text-muted-foreground">Update your sign-in credentials.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gmg-gold/15 text-sm font-bold uppercase text-gmg-gold">
            {current.username.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.username}</p>
            <p className="text-xs text-muted-foreground">Signed-in admin</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-username">Username</Label>
          <Input
            id="new-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setMessage(null)
            }}
            placeholder="Enter username"
          />
        </div>

        <Separator className="my-4" />

        <PasswordField
          id="sec-new-pass"
          label="New password (optional)"
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v)
            setMessage(null)
          }}
          show={showNew}
          onToggle={() => setShowNew((s) => !s)}
          placeholder="Leave blank to keep current password"
        />

        {newPassword && (
          <>
            <div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= score ? STRENGTH_COLORS[score] : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {`Password strength: ${STRENGTH_LABELS[score]}`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-confirm-pass">Confirm new password</Label>
              <Input
                id="sec-confirm-pass"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setMessage(null)
                }}
                placeholder="Re-enter new password"
              />
            </div>
          </>
        )}

        <Separator className="my-4" />

        <PasswordField
          id="acct-cur-pass"
          label="Current password"
          value={currentPassword}
          onChange={(v) => {
            setCurrentPassword(v)
            setMessage(null)
          }}
          show={showCurrent}
          onToggle={() => setShowCurrent((s) => !s)}
          placeholder="Confirm changes with current password"
        />

        {message && <FormAlert type={message.type} text={message.text} />}

        <div className="flex justify-end pt-1">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
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


/* Small presentational helpers. */



function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={label.startsWith("Current") ? "current-password" : "new-password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 flex items-center justify-center rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function FormAlert({ type, text }: { type: "success" | "error"; text: string }) {
  const success = type === "success"
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-gmg-red/30 bg-gmg-red/10 text-gmg-red"
      }`}
    >
      {success ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <span>{text}</span>
    </div>
  )
}
