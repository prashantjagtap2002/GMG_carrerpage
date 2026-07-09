import { useSyncExternalStore } from "react"

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

export function usePipelineStore() {
  const stages = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  function addStage(stage: Omit<PipelineStage, "id">) {
    const id = stage.label.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now()
    currentStages = [...currentStages, { id, ...stage }]
    emit()
  }

  function updateStage(id: string, updates: Partial<Omit<PipelineStage, "id">>) {
    currentStages = currentStages.map((s) => (s.id === id ? { ...s, ...updates } : s))
    emit()
  }

  function deleteStage(id: string) {
    currentStages = currentStages.filter((s) => s.id !== id)
    emit()
  }

  function reorderStages(startIndex: number, endIndex: number) {
    const newStages = Array.from(currentStages)
    const [removed] = newStages.splice(startIndex, 1)
    newStages.splice(endIndex, 0, removed)
    currentStages = newStages
    emit()
  }

  return {
    stages,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
  }
}
