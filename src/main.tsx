import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ClerkProvider } from "@clerk/clerk-react"
import { dark } from "@clerk/themes"
import App from "./App"
import "./index.css"

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — set it in .env (see .env.example).")
}

// Matches the GMG dark/gold palette in src/index.css & tailwind.config.js so
// Clerk's own widgets (<SignIn>, <UserProfile>, <UserButton>) blend in
// instead of rendering with Clerk's default light theme.
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#FFB400",
    colorBackground: "#0a0a0b",
    colorInputBackground: "#141414",
    colorText: "#fafafa",
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
      afterSignOutUrl="/admin"
      signInFallbackRedirectUrl="/admin"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
)
