import { useState } from "react"
import { Link } from "react-router-dom"
import { Briefcase, ExternalLink, LogOut, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobsManager } from "@/components/JobsManager"
import { ApplicationsManager } from "@/components/ApplicationsManager"

const ADMIN_PASSWORD = "admin123"
const AUTH_KEY = "gmg-crm-authed"

const GMG_LOGO =
  "https://bunny-wp-pullzone-cghvklkcns.b-cdn.net/wp-content/uploads/2026/01/Untitled-design-32.png"

function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1"
  } catch {
    return false
  }
}

function setAuth(v: boolean) {
  try {
    if (v) sessionStorage.setItem(AUTH_KEY, "1")
    else sessionStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
}

export function AdminPage() {
  const [authed, setAuthedState] = useState(isAuthed())
  const [tab, setTab] = useState<"jobs" | "applications">("jobs")

  if (!authed) return <LoginGate onSuccess={() => setAuthedState(true)} />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-gmg-black text-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={GMG_LOGO} alt="GMG" className="h-8 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">GMG Careers · CRM</div>
              <div className="text-xs text-white/50">Mini CRM</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/">
                <ExternalLink className="h-4 w-4" /> View site
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setAuth(false)
                setAuthedState(false)
              }}
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
        <div className="container flex gap-1 pb-2">
          <TabButton active={tab === "jobs"} onClick={() => setTab("jobs")}>
            <Briefcase className="h-4 w-4" /> Job Descriptions
          </TabButton>
          <TabButton active={tab === "applications"} onClick={() => setTab("applications")}>
            <Users className="h-4 w-4" /> Applications
          </TabButton>
        </div>
      </header>

      <main className="container flex-1 py-8">
        {tab === "jobs" ? <JobsManager /> : <ApplicationsManager />}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuth(true)
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gmg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] p-8 text-white"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={GMG_LOGO} alt="GMG" className="h-10 w-auto" />
          <h1 className="mt-4 text-xl font-bold">GMG Careers CRM</h1>
          <p className="mt-1 text-sm text-white/60">
            Sign in to manage job descriptions and applications.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crm-pass" className="text-white">
            Password
          </Label>
          <Input
            id="crm-pass"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
            className="border-white/15 bg-white/[0.04] text-white placeholder:text-white/40 focus-visible:ring-gmg-gold"
            placeholder="Enter password"
            autoFocus
          />
        </div>
        {error && <p className="mt-2 text-sm text-gmg-red">Incorrect password. Try again.</p>}
        <Button type="submit" className="mt-5 w-full">
          Sign in
        </Button>
        <p className="mt-4 text-center text-xs text-white/40">
          Demo password: <span className="font-semibold text-white/70">admin123</span>
        </p>
        <Link
          to="/"
          className="mt-3 block text-center text-xs text-white/50 transition-colors hover:text-white"
        >
          ← Back to careers site
        </Link>
      </form>
    </div>
  )
}
