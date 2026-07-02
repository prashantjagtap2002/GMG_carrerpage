import { Route, Routes } from "react-router-dom"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { HomePage } from "@/pages/HomePage"
import { JobDetailPage } from "@/pages/JobDetailPage"

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
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
