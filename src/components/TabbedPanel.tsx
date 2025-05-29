import { useState, useEffect } from "react"
import MarketSelector from "./MarketSelector"
import StrategyInputs from "./StrategyInputs"
import StrategyExplorer from "./StrategyExplorer"
import { useMarket } from "./MarketContext"
import { useSearchParams } from "react-router-dom"
import PresetExplorer from "./PresetExplorer"

// -------------

export default function TabbedPanel() {
  const [strategyPath, setStrategyPath] = useState<string | null>(null)

  // const { symbol, timeframe } = useMarket()
  const [searchParams, setSearchParams] = useSearchParams()

  // === Инициализация состояния из URL ===
  const initialTab = (searchParams.get("tab") || "market") as
    | "market"
    | "parameters"
    | "strategies"
    | "presets"
  const [activeTab, setActiveTab] = useState<typeof initialTab>(initialTab)
  const initialPresetPath = searchParams.get("preset")
  const [presetPath, setPresetPath] = useState<string | null>(initialPresetPath)

  const tabs = [
    { key: "market", label: "Market" },
    { key: "parameters", label: "Parameters" },
    { key: "strategies", label: "Strategies" },
    { key: "presets", label: "Presets" },
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
        {activeTab === "parameters" && (
          <StrategyInputs presetPath={presetPath} strategyPath={strategyPath} />
        )}

        {activeTab === "strategies" && (
          <StrategyExplorer
            onSelectStrategy={(strategyPath) => {
              setStrategyPath(strategyPath) // ✅ сохраняем путь к .py
              handleTabChange("parameters")

              const newParams = new URLSearchParams(searchParams)
              newParams.set("parameters", strategyPath)
              setSearchParams(newParams)
            }}
          />
        )}
        {activeTab === "presets" && (
          <PresetExplorer
            onSelectPreset={(presetPath) => {
              setPresetPath(presetPath)
              handleTabChange("parameters")
              const newParams = new URLSearchParams(searchParams)
              newParams.set("preset", presetPath)
              newParams.set("tab", "parameters")
              setSearchParams(newParams)
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
