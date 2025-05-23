import { useEffect, useState } from "react"

type InputField = {
  name: string
  description: string
  default: number | string
  step?: number
}

export default function StrategyInputs({
  selectedStrategy,
}: {
  selectedStrategy: string | null
}) {
  const [steps, setSteps] = useState<{ [key: string]: number }>({})
  const [inputs, setInputs] = useState<InputField[]>([])
  const [values, setValues] = useState<{ [key: string]: string | number }>({})
  const [defaults, setDefaults] = useState<{
    symbol?: string
    timeframe?: string
  }>({})

  // Загружаем inputs.json при выборе стратегии
  useEffect(() => {
    if (!selectedStrategy) return

    const strategyDir = selectedStrategy.replace(/\/[^\/]+\.py$/, "") // путь к папке

    fetch(`http://127.0.0.1:8000/load-inputs?path=${strategyDir}`)
      .then((res) => res.json())
      .then((data) => {
        setInputs(data)

        const defaultMap: any = {}
        const stepMap: any = {}

        data.forEach((item: InputField) => {
          defaultMap[item.name] = item.default
          if (
            typeof item.default === "number" &&
            typeof item.step === "number"
          ) {
            stepMap[item.name] = item.step
          }
        })

        setValues(defaultMap)
        setSteps(stepMap) // 🔧 сохраняем шаги в состояние
      })

    // Подгрузим symbol/timeframe из strategy.py для справки
    fetch(`http://127.0.0.1:8000/load-strategy-meta?path=${strategyDir}`)
      .then((res) => res.json())
      .then((data) => {
        setDefaults({ symbol: data.symbol, timeframe: data.timeframe })
      })
  }, [selectedStrategy])

  const updateValue = (name: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const runBacktest = async () => {
    if (!selectedStrategy) return
    const res = await fetch("http://127.0.0.1:8000/run-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: selectedStrategy,
        inputs: values,
      }),
    })
    const result = await res.json()
    console.log("Backtest result:", result)
  }

  return (
    <div style={{ padding: "1rem", color: "#ccc" }}>
      <h4>⚙️ Strategy Parameters</h4>

      {inputs.map((field) => (
        <div key={field.name} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label
              style={{ minWidth: "120px", color: "#ccc", fontWeight: 500 }}
            >
              {field.description}
            </label>

            <input
              type={typeof field.default === "number" ? "number" : "text"}
              {...(typeof field.default === "number"
                ? { step: steps[field.name] ?? 1 }
                : {})}
              value={values[field.name]}
              onChange={(e) =>
                updateValue(
                  field.name,
                  typeof field.default === "number"
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

            {typeof field.default === "number" && (
              <input
                type="number"
                value={steps[field.name] ?? 1}
                onChange={(e) =>
                  setSteps((prev) => ({
                    ...prev,
                    [field.name]: parseFloat(e.target.value) || 1,
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

            {(field.name === "symbol" || field.name === "timeframe") && (
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "0.85rem",
                  color: "#777",
                  whiteSpace: "nowrap",
                }}
              >
                {" "}
                {field.name === "symbol" ? defaults.symbol : defaults.timeframe}
              </div>
            )}
          </div>
        </div>
      ))}

      <button onClick={runBacktest}>▶️ Run Backtest</button>
    </div>
  )
}
