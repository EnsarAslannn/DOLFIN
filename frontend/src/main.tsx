import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { RouterProvider } from "react-router-dom"
import { router } from "./Routes/Routes.tsx"
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.tsx"
import { LanguageProvider } from "./i18n/LanguageProvider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)
