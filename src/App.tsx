import { useEffect } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { HomePage } from "@/pages/HomePage"
import { JobDetailPage } from "@/pages/JobDetailPage"

// Ensure every route change starts at the top of the page.
// Without this, opening a job detail keeps the previous scroll offset
// and lands the user in the middle of the page.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <HomePage />
            </>
          }
        />
        {/* Local job detail route — keeps users on this site, no redirect to IIDE/Zoho */}
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
    </div>
  )
}
