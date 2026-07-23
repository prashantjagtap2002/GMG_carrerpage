type ToastType = "error" | "success" | "info"
type ToastListener = (toast: ToastMessage) => void

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  createdAt: number
}

let listeners: ToastListener[] = []

function emit(toast: ToastMessage) {
  for (const fn of listeners) fn(toast)
}

export function subscribe(listener: ToastListener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function toast(type: ToastType, message: string) {
  emit({ id: `toast-${crypto.randomUUID()}`, type, message, createdAt: Date.now() })
}

export function toastError(message: string) {
  toast("error", message)
}

export function toastSuccess(message: string) {
  toast("success", message)
}
