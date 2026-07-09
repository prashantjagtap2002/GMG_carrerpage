import type { ApplicationStage } from "@/lib/storage"

export const APPLICATION_STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
]

export const STAGE_LABEL: Record<ApplicationStage, string> = Object.fromEntries(
  APPLICATION_STAGES.map((s) => [s.value, s.label]),
) as Record<ApplicationStage, string>

/** Tailwind classes for the small stage dot/badge, per stage. */
export const STAGE_DOT_CLASS: Record<ApplicationStage, string> = {
  new: "bg-slate-400",
  contacted: "bg-blue-500",
  screening: "bg-amber-500",
  interview: "bg-violet-500",
  offer: "bg-cyan-500",
  hired: "bg-green-500",
  rejected: "bg-red-500",
}
