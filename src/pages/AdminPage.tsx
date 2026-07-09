import { Link, useSearchParams } from "react-router-dom"
import { Briefcase, ExternalLink, Settings, Users } from "lucide-react"
import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { JobsManager } from "@/components/JobsManager"
import { ApplicationsManager } from "@/components/ApplicationsManager"
import { SettingsManager } from "@/components/SettingsManager"

const GMG_LOGO =
  "https://bunny-wp-pullzone-cghvklkcns.b-cdn.net/wp-content/uploads/2026/01/Untitled-design-32.png"

type AdminTab = "jobs" | "applications" | "settings"

function isAdminTab(value: string | null): value is AdminTab {
  return value === "jobs" || value === "applications" || value === "settings"
}

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = isAdminTab(searchParams.get("tab")) ? (searchParams.get("tab") as AdminTab) : "jobs"
  const setTab = (next: AdminTab) => setSearchParams({ tab: next }, { replace: true })

  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gmg-black px-4">
          <div className="flex flex-col items-center text-center">
            <img src={GMG_LOGO} alt="GMG" className="h-10 w-auto" />
            <h1 className="mt-4 text-xl font-bold text-white">GMG Careers CRM</h1>
            <p className="mt-1 text-sm text-white/60">
              Sign in to manage job descriptions and applications.
            </p>
          </div>
          <SignIn routing="hash" fallbackRedirectUrl="/admin" />
          <Link to="/" className="text-xs text-white/50 transition-colors hover:text-white">
            ← Back to careers site
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
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
              <div className="flex items-center gap-3">
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
      </SignedIn>
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
        active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}
