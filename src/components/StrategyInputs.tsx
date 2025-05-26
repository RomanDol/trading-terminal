// StrategyInputs.tsx — улучшенный вариант с передачей полного пресета

import { useEffect, useState } from "react"
import PresetSelector from "./PresetSelector/PresetSelector"

export default function StrategyInputs({
  selectedStrategy,
}: {
  selectedStrategy: string | null
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
  }>({})
  

  useEffect(() => {
    if (!selectedStrategy) return

    const strategyDir = selectedStrategy.replace(/\/[^\/]+\.py$/, "")

    fetch(`http://127.0.0.1:8000/load-inputs?path=${strategyDir}`)
      .then((res) => res.json())
      .then((data) => {
        const preset =
          data.find((p: any) => p.isActive) ??
          data.find((p: any) => p.preset === "default")

        if (!preset) return

        const baseName = preset.preset.replace(/^__\d+__/, "")
        const original = data.find((p: any) => p.preset === baseName)

        const originalSymbol = original?.symbol?.value
        const originalTimeframe = original?.timeframe?.value

        setOriginalPresetValues({
          symbol: originalSymbol,
          timeframe: originalTimeframe,
        })
      
        const { preset: _, ...fields } = preset
        setActivePresetName(preset.preset)
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
      })

    fetch(`http://127.0.0.1:8000/load-strategy-meta?path=${strategyDir}`)
      .then((res) => res.json())
      .then((data) => {
        setDefaults({ symbol: data.symbol, timeframe: data.timeframe })
      })
  }, [selectedStrategy])

  const updateValue = (name: string, value: string | number) => {
    setValues((prev: { [key: string]: any }) => ({ ...prev, [name]: value }))
  }

  const runBacktest = async () => {
    if (!selectedStrategy) return
    const res = await fetch("http://127.0.0.1:8000/run-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selectedStrategy, inputs: values }),
    })
    const result = await res.json()
    console.log("Backtest result:", result)
  }

  const handlePresetLoad = (preset: any) => {
    const { preset: _, ...fields } = preset
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
  }

  return (
    <div style={{ padding: "1rem", color: "#ccc" }}>
      {selectedStrategy && (
        <PresetSelector
          strategyPath={selectedStrategy.replace(/\/[^\/]+\.py$/, "")}
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
                value={values[name]}
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

              {(name === "str_name" || name === "strategy") &&
                activePresetName && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#777",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activePresetName.replace(/^__\d+__/, "")}
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

      <button onClick={runBacktest}>Run Backtest</button>
    </div>
  )
}
