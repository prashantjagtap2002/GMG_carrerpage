import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { Hero } from "@/components/Hero"
import { HomePage } from "@/pages/HomePage"
import { JobDetailPage } from "@/pages/JobDetailPage"
import { ApplyPage } from "@/pages/ApplyPage"
import { AdminPage } from "@/pages/AdminPage"

// Remember the scroll position of each route so navigation feels natural:
// opening a job detail starts at the top (a route we haven't visited yet),
// while "Back to all jobs" restores the exact spot in the list you left from.
function ScrollManager() {
  const { pathname } = useLocation()
  const positions = useRef<Map<string, number>>(new Map())
  const activePath = useRef(pathname)

  // Single lifetime listener that records the current route's scroll offset.
  useEffect(() => {
    const handleScroll = () => {
      positions.current.set(activePath.current, window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // On route change, restore the remembered offset (or start at the top for a
  // route we haven't seen), before the browser paints to avoid a visible jump.
  useLayoutEffect(() => {
    const saved = positions.current.get(pathname)
    window.scrollTo({ top: saved ?? 0, left: 0, behavior: "instant" as ScrollBehavior })
    activePath.current = pathname
  }, [pathname])

  return null
}

// Public pages render without the marketing header/footer chrome: a clean,
// embeddable careers surface (IIDE-style). Admin lives at /admin.
function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Routes>
        {/* Mini CRM: standalone admin dashboard (no marketing chrome) */}
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/"
          element={
            <PublicLayout>
              <Hero />
              <HomePage />
            </PublicLayout>
          }
        />
        {/* Local job detail route: keeps users on this site, no redirect to IIDE/Zoho */}
        <Route
          path="/jobs/:id"
          element={
            <PublicLayout>
              <JobDetailPage />
            </PublicLayout>
          }
        />
        {/* Full-page application form for a specific job. */}
        <Route
          path="/jobs/:id/apply"
          element={
            <PublicLayout>
              <ApplyPage />
            </PublicLayout>
          }
        />
        <Route
          path="*"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
      </Routes>
    </div>
  )
}
