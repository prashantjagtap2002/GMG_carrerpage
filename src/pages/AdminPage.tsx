import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Briefcase, ExternalLink, Settings, ShieldAlert, Users } from "lucide-react"
import { SignIn, UserButton, useAuth, useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { JobsManager } from "@/components/JobsManager"
import { ApplicationsManager } from "@/components/ApplicationsManager"
import { SettingsManager } from "@/components/SettingsManager"
import { refreshPipelineStages } from "@/lib/pipeline"
import { listAdminUsers } from "@/lib/admin-users"

const GMG_LOGO =
  "https://bunny-wp-pullzone-cghvklkcns.b-cdn.net/wp-content/uploads/2026/01/Untitled-design-32.png"

type AdminTab = "jobs" | "applications" | "settings"

function isAdminTab(value: string | null): value is AdminTab {
  return value === "jobs" || value === "applications" || value === "settings"
}

function AdminPanel({
  tab,
  setTab,
}: {
  tab: AdminTab
  setTab: (next: AdminTab) => void
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-white text-foreground">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={GMG_LOGO} alt="GMG" className="h-8 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">GMG Careers · CRM</div>
              <div className="text-xs text-foreground/50">Mini CRM</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-foreground/30 bg-transparent text-foreground hover:bg-muted hover:text-foreground"
            >
              <Link to="/">
                <ExternalLink className="h-4 w-4" /> View site
              </Link>
            </Button>
            <UserButton afterSignOutUrl="/admin" />
          </div>
        </div>
        <div className="container flex gap-1 pb-2">
          <TabButton active={tab === "jobs"} onClick={() => setTab("jobs")}>
            <Briefcase className="h-4 w-4" /> Job Descriptions
          </TabButton>
          <TabButton active={tab === "applications"} onClick={() => setTab("applications")}>
            <Users className="h-4 w-4" /> Applications
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            <Settings className="h-4 w-4" /> Settings
          </TabButton>
        </div>
      </header>

      <main className="container flex-1 py-8">
        {tab === "jobs" ? (
          <JobsManager />
        ) : tab === "applications" ? (
          <ApplicationsManager />
        ) : (
          <SettingsManager />
        )}
      </main>
    </div>
  )
}

function NotAuthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
      <p className="text-sm text-foreground/60 text-center max-w-sm">
        Your account does not have admin privileges. Contact the site administrator if you believe
        this is an error.
      </p>
      <Link
        to="/"
        className="text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        ← Back to careers site
      </Link>
    </div>
  )
}

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = isAdminTab(searchParams.get("tab")) ? (searchParams.get("tab") as AdminTab) : "jobs"
  const setTab = (next: AdminTab) => setSearchParams({ tab: next }, { replace: true })
  const { isSignedIn } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [roleChecked, setRoleChecked] = useState(false)
  const [hasAdminRole, setHasAdminRole] = useState(false)

  const verifyAdminRole = useCallback(async () => {
    if (!user || !isUserLoaded) return
    try {
      const metadata = user.publicMetadata as { role?: string }
      if (metadata.role === "admin") {
        setHasAdminRole(true)
        setRoleChecked(true)
        return
      }
      await listAdminUsers()
      await user.reload()
      const refreshed = user.publicMetadata as { role?: string }
      if (refreshed.role === "admin") {
        setHasAdminRole(true)
      }
    } catch {
      setHasAdminRole(false)
    } finally {
      setRoleChecked(true)
    }
  }, [user, isUserLoaded])

  useEffect(() => {
    if (isSignedIn) void refreshPipelineStages()
  }, [isSignedIn])

  useEffect(() => {
    if (isSignedIn && isUserLoaded) {
      verifyAdminRole()
    } else if (!isSignedIn) {
      setRoleChecked(false)
      setHasAdminRole(false)
    }
  }, [isSignedIn, isUserLoaded, verifyAdminRole])

  const showSignIn = !isSignedIn
  const showLoading = isSignedIn && (!isUserLoaded || !roleChecked)
  const showAdmin = isSignedIn && isUserLoaded && roleChecked && hasAdminRole
  const showDenied = isSignedIn && isUserLoaded && roleChecked && !hasAdminRole

  return (
    <>
      {showSignIn && (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
          <div className="flex flex-col items-center text-center">
            <img src={GMG_LOGO} alt="GMG" className="h-10 w-auto" />
            <h1 className="mt-4 text-xl font-bold text-foreground">GMG Careers CRM</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Sign in to manage job descriptions and applications.
            </p>
          </div>
          <SignIn routing="hash" fallbackRedirectUrl="/admin" />
          <Link to="/" className="text-xs text-foreground/50 transition-colors hover:text-foreground">
            ← Back to careers site
          </Link>
        </div>
      )}

      {showLoading && (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
          <img src={GMG_LOGO} alt="GMG" className="h-10 w-auto" />
          <p className="text-sm text-foreground/60">Verifying access…</p>
        </div>
      )}

      {showAdmin && <AdminPanel tab={tab} setTab={setTab} />}
      {showDenied && <NotAuthorized />}
    </>
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
        active ? "bg-muted text-foreground" : "text-foreground/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}
