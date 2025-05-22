import { useState } from "react"
import MarketSelector from "./MarketSelector"
import StrategyInputs from "./StrategyInputs"

export default function TabbedPanel() {
  const [activeTab, setActiveTab] = useState<"market" | "strategy">("market")

  const tabs = [
    { key: "market", label: "📊 Market" },
    { key: "strategy", label: "⚙️ Strategy" },
  ] as const

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Кнопки вкладок как в нижней панели */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #333",
          marginBottom: "0.5rem",
        }}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        {activeTab === "market" && <MarketSelector />}
        {activeTab === "strategy" && <StrategyInputs />}
      </div>
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        padding: "0.5rem 1rem",
        background: active ? "#333" : "transparent",
        color: active ? "#fff" : "#888",
        border: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </button>
  )
}
 