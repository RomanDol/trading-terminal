import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { MarketProvider } from "./components/MarketContext.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MarketProvider>
      <App />
    </MarketProvider>
  </StrictMode>
)
