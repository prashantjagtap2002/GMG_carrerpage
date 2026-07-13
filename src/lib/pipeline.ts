import { useSyncExternalStore } from "react"
import { fetchJSON, syncFetch } from "@/lib/crm-store"

export type PipelineStage = {
  id: string
  label: string
  color: string
}

const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: "new", label: "New", color: "bg-slate-400" },
  { id: "contacted", label: "Contacted", color: "bg-blue-500" },
  { id: "qualified", label: "Qualified", color: "bg-amber-500" },
  { id: "proposal", label: "Proposal", color: "bg-violet-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
]

const PIPELINE_KEY = "gmg-pipeline-stages"

function loadStages(): PipelineStage[] {
  try {
    const data = localStorage.getItem(PIPELINE_KEY)
    if (data) return JSON.parse(data)
  } catch (err) {
    console.error("Failed to load pipeline stages:", err)
  }
  return DEFAULT_PIPELINE_STAGES
}

function saveStages(stages: PipelineStage[]) {
  try {
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(stages))
  } catch (err) {
    console.error("Failed to save pipeline stages:", err)
  }
}

// Stages live in Supabase (shared across every admin) via the
// pipeline-stages Netlify Function; localStorage is kept only as an offline
// cache so the UI has something to paint before the first fetch resolves.
let currentStages: PipelineStage[] = loadStages()
const listeners = new Set<() => void>()

function emit() {
  saveStages(currentStages)
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentStages
}

type RemoteStage = { id: string; label: string; color: string; sort_order: number }

/** Pull the current pipeline stages from Supabase — admin-only, called once a CRM session is available. */
export async function refreshPipelineStages(): Promise<void> {
  const body = await fetchJSON<{ stages: RemoteStage[] }>("pipeline-stages")
  if (!body) return
  currentStages = body.stages
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ id: s.id, label: s.label, color: s.color }))
  emit()
}

export function usePipelineStore() {
  const stages = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  function addStage(stage: Omit<PipelineStage, "id">) {
    const id = stage.label.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now()
    const sortOrder = currentStages.length
    currentStages = [...currentStages, { id, ...stage }]
    emit()
    void syncFetch("pipeline-stages", "POST", { id, label: stage.label, color: stage.color, sortOrder })
  }

  function updateStage(id: string, updates: Partial<Omit<PipelineStage, "id">>) {
    currentStages = currentStages.map((s) => (s.id === id ? { ...s, ...updates } : s))
    emit()
    void syncFetch("pipeline-stages", "PATCH", { id, patch: updates })
  }

  function deleteStage(id: string) {
    currentStages = currentStages.filter((s) => s.id !== id)
    emit()
    void syncFetch("pipeline-stages", "DELETE", { id })
  }

  function reorderStages(startIndex: number, endIndex: number) {
    const newStages = Array.from(currentStages)
    const [removed] = newStages.splice(startIndex, 1)
    newStages.splice(endIndex, 0, removed)
    currentStages = newStages
    emit()
    void syncFetch(
      "pipeline-stages",
      "PUT",
      { ids: newStages.map((s) => s.id) },
    )
  }

  return {
    stages,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
  }
}
