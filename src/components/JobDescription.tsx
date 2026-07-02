const HEADERS = [
  "About IIDE:",
  "About the Role:",
  "About the role:",
  "What You'll Do:",
  "What you'll do:",
  "Key Responsibilities",
  "Responsibilities",
  "Requirements",
  "Who You Are:",
  "Must-Have",
  "Must Have",
  "Should-Have",
  "Should Have",
  "Nice to Have",
  "Nice-to-Have",
  "Nice to have",
  "Work Mode:",
  "Location:",
]

export function JobDescription({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground">No description available.</p>

  let normalized = text.replace(/\t/g, " ").replace(/●\s*/g, "\n● ").replace(/○\s*/g, "\n○ ")

  HEADERS.forEach((h) => {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    normalized = normalized.replace(new RegExp(esc, "g"), "\n\n" + h)
  })

  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
      {lines.map((line, i) => {
        if (line.startsWith("●")) {
          return (
            <p key={i} className="pt-2 font-semibold text-primary">
              {line.replace(/^●\s*/, "")}
            </p>
          )
        }
        if (line.startsWith("○")) {
          return (
            <p key={i} className="flex gap-2.5 pl-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>{line.replace(/^○\s*/, "")}</span>
            </p>
          )
        }
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}
