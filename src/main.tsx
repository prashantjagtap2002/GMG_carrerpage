import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ClerkProvider } from "@clerk/clerk-react"
import App from "./App"
import "./index.css"

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — set it in .env (see .env.example).")
}

const SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_URL || "/admin"
const SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_URL || "/admin"
const AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || "/admin"
const AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || "/admin"

const clerkAppearance = {
  variables: {
    colorPrimary: "#FFB400",
    colorTextSecondary: "#69727D",
    colorDanger: "#CC1818",
    borderRadius: "0.75rem",
  },
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      afterSignInUrl={AFTER_SIGN_IN_URL}
      afterSignUpUrl={AFTER_SIGN_UP_URL}
      afterSignOutUrl="/admin"
      signInFallbackRedirectUrl="/admin"
      signUpFallbackRedirectUrl="/admin"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
)
