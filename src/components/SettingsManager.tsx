import { useState } from "react"
import { Plus, Trash2, GripVertical, UserCog } from "lucide-react"
import { UserProfile } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePipelineStore } from "@/lib/pipeline"

/**
 * CRM "Settings" tab. Sign-in and account management (email, password, etc.)
 * are handled by Clerk — this tab embeds Clerk's own account UI plus the
 * pipeline stage editor, which Clerk has no concept of.
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
            Manage your account and the hiring pipeline for this CRM.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <PipelineSettingsSection />
        <AccountSection />
      </div>
    </div>
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
      <div className="p-5">
        <UserProfile routing="hash" />
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

