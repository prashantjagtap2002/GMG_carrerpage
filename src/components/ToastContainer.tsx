import { useEffect, useState } from "react"
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { subscribe, type ToastMessage } from "@/lib/toast"
import { cn } from "@/lib/utils"

const TOAST_DURATION = 5000

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, TOAST_DURATION)
    return () => clearTimeout(timeout)
  }, [onDismiss])

  const icon =
    toast.type === "error" ? (
      <AlertTriangle className="h-4 w-4 text-destructive" />
    ) : toast.type === "success" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Info className="h-4 w-4 text-blue-500" />
    )

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg animate-in slide-in-from-right",
        toast.type === "error" && "border-destructive/30",
        toast.type === "success" && "border-green-200",
        toast.type === "info" && "border-blue-200",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="flex-1 text-sm text-foreground">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    return subscribe((toast) => {
      setToasts((prev) => [...prev, toast])
    })
  }, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}
