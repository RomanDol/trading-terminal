import { useState, useEffect } from "react"
import MarketSelector from "./MarketSelector"
import StrategyInputs from "./StrategyInputs"
import StrategyExplorer from "./StrategyExplorer"
import { useMarket } from "./MarketContext"
import { useSearchParams } from "react-router-dom"

export default function TabbedPanel() {
  const { symbol, timeframe } = useMarket()
  const [searchParams, setSearchParams] = useSearchParams()

  // === Инициализация состояния из URL ===
  const initialTab = (searchParams.get("tab") || "market") as
    | "market"
    | "strategy"
    | "strategies"
  const initialStrategy = searchParams.get("strategy")

  const [activeTab, setActiveTab] = useState<typeof initialTab>(initialTab)
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(
    initialStrategy
  )

  const tabs = [
    { key: "market", label: "Market" },
    { key: "strategy", label: "Parameters" },
    { key: "strategies", label: "Strategies" },
  ] as const

  // === Обновление URL при переключении вкладки ===
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set("tab", tab)
    setSearchParams(newParams)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Кнопки вкладок */}
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
            onClick={() => handleTabChange(tab.key)}
          />
        ))}
      </div>

      <div style={{ flexGrow: 1, overflow: "hidden" }}>
        {activeTab === "market" && <MarketSelector />}
        {activeTab === "strategy" && (
          <StrategyInputs selectedStrategy={selectedStrategy} />
        )}
        {activeTab === "strategies" && (
          <StrategyExplorer
            onSelectStrategy={async (strategyPath) => {
              setSelectedStrategy(strategyPath)
              handleTabChange("strategy") // переключаем вкладку

              // сохраняем в URL
              const newParams = new URLSearchParams(searchParams)
              newParams.set("strategy", strategyPath)
              setSearchParams(newParams)

              const res = await fetch("http://127.0.0.1:8000/run-strategy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  path: strategyPath,
                  symbol,
                  timeframe,
                }),
              })
              const result = await res.json()
              console.log("Auto-run result:", result)
            }}
          />
        )}
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
