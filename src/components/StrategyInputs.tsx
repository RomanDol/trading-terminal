import { useMarket } from "./MarketContext"

import { useEffect, useState } from "react"
import PresetSelector from "./PresetSelector/PresetSelector"

export default function StrategyInputs({
  presetPath,
}: {
  presetPath: string | null
}) {
  const [activePresetName, setActivePresetName] = useState<string | null>(null)
  const [inputs, setInputs] = useState<any>({}) // весь пресет
  const [values, setValues] = useState<any>({}) // просто name → value
  const [steps, setSteps] = useState<any>({})
  const [defaults, setDefaults] = useState<{
    symbol?: string
    timeframe?: string
  }>({})
  const [originalPresetValues, setOriginalPresetValues] = useState<{
    symbol?: string
    timeframe?: string
    file_name?: string
  }>({})

  const { symbol, timeframe } = useMarket()



  useEffect(() => {
    if (!presetPath) return

    fetch(`http://127.0.0.1:8000/api/presets/load-file?path=${presetPath}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return

        const presetsObject = data.inputs
        const entries = Object.entries(presetsObject)

        const [activeName, activePreset] =
          entries.find(([_, val]: any) => val.isActive) ??
          entries.find(([key]) => key === "default") ??
          entries[0] ??
          []

        if (!activePreset) return

        setActivePresetName(activeName)
        setInputs(activePreset)
        setValues(
          Object.fromEntries(
            Object.entries(activePreset).map(([k, v]: any) => [k, v.value])
          )
        )
        setSteps(
          Object.fromEntries(
            Object.entries(activePreset).map(([k, v]: any) => [k, v.step ?? 1])
          )
        )
      })
  }, [presetPath])
  
  

  useEffect(() => {
    if (!inputs || Object.keys(inputs).length === 0) return

    const updated: { [key: string]: any } = {}

    if (inputs.symbol && symbol !== values["symbol"]) {
      updated["symbol"] = symbol
    }

    if (inputs.timeframe && timeframe !== values["timeframe"]) {
      updated["timeframe"] = timeframe
    }

    if (Object.keys(updated).length > 0) {
      setValues((prev: Record<string, any>) => ({
        ...prev,
        ...updated,
      }))
    }
  }, [symbol, timeframe])

  const updateValue = (name: string, value: string | number) => {
    setValues((prev: { [key: string]: any }) => ({ ...prev, [name]: value }))
  }

  const runBacktest = async () => {
    if (!presetPath) return
    const res = await fetch("http://127.0.0.1:8000/run-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: presetPath, inputs: values }),
    })
    const result = await res.json()
    console.log("Backtest result:", result)
  }



  return (
    <div style={{ padding: "1rem", color: "#ccc" }}>
      {presetPath && (
        <PresetSelector
          strategyPath={presetPath.replace(/\/[^\/]+\.py$/, "")}
          currentValues={Object.fromEntries(
            Object.entries(values).map(([k, v]) => [
              k,
              { ...inputs[k], value: v },
            ])
          )}
          activePresetName={activePresetName}
          onSelectPreset={(name, fields) => {
            setActivePresetName(name)
            setInputs(fields)
            setValues(
              Object.fromEntries(
                Object.entries(fields).map(([k, v]: any) => [k, v.value])
              )
            )
            setSteps(
              Object.fromEntries(
                Object.entries(fields).map(([k, v]: any) => [k, v.step ?? 1])
              )
            )

            // Загрузим оригинальный пресет
            const baseName = name.replace(/^__\d+__/, "")
            const strategyDir = presetPath?.replace(/\/[^\/]+\.py$/, "")
            if (strategyDir) {
              fetch(`http://127.0.0.1:8000/load-inputs?path=${strategyDir}`)
                .then((res) => res.json())
                .then((allPresets) => {
                  const original = allPresets.find(
                    (p: any) => p.preset === baseName
                  )
                  const file_name = original?.file_name?.value
                  const symbol = original?.symbol?.value
                  const timeframe = original?.timeframe?.value
                  setOriginalPresetValues({ file_name, symbol, timeframe })
                })
            }
          }}
        />
      )}

      {Object.entries(inputs)
        .filter(([name]) => name !== "isActive") // ⬅️ добавили фильтр
        .map(([name, field]: any) => (
          <div key={name} style={{ marginBottom: "1rem" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <label
                style={{ minWidth: "120px", color: "#ccc", fontWeight: 500 }}
              >
                {field.description}
              </label>
              <input
                type={typeof field.value === "number" ? "number" : "text"}
                step={steps[name] ?? 1}
                value={
                  name === "symbol" && symbol !== values["symbol"]
                    ? symbol
                    : name === "timeframe" && timeframe !== values["timeframe"]
                    ? timeframe
                    : values[name]
                }
                onChange={(e) =>
                  updateValue(
                    name,
                    typeof field.value === "number"
                      ? parseFloat(e.target.value)
                      : e.target.value
                  )
                }
                style={{
                  width: "100px",
                  padding: "0.4rem",
                  background: "#111",
                  color: "#eee",
                  border: "1px solid #444",
                  borderRadius: 4,
                }}
              />
              {typeof field.value === "number" && (
                <input
                  type="number"
                  value={steps[name] ?? 1}
                  onChange={(e) =>
                    setSteps((prev: any) => ({
                      ...prev,
                      [name]: parseFloat(e.target.value) || 1,
                    }))
                  }
                  style={{
                    width: "70px",
                    background: "#111",
                    color: "#aaa",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "0.4rem",
                  }}
                  title="Step size"
                />
              )}

              {(name === "file_name" || name === "strategy") &&
                activePresetName && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#777",
                    }}
                  >
                    {originalPresetValues.file_name}
                  </div>
                )}

              {(name === "symbol" || name === "timeframe") && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#777",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name === "symbol"
                    ? originalPresetValues.symbol
                    : originalPresetValues.timeframe}
                </div>
              )}
            </div>
          </div>
        ))}
      <button
        style={{
          padding: "0.4rem 1rem",
          borderRadius: "4px",
          border: "1px solid #444",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          outline: "none",
          background: "#030",
          color: "#0f0",
        }}
        onClick={runBacktest}
      >
        Run Backtest
      </button>
    </div>
  )
}
