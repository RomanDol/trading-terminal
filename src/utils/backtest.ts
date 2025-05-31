const API_URL = "http://127.0.0.1:8000"

export interface BacktestParams {
  strategyPath: string
  inputs: Record<string, any>
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

export const runBacktest = async ({
  strategyPath,
  inputs,
  onSuccess,
  onError,
}: BacktestParams) => {
  try {
    console.log("backtest.ts - " + JSON.stringify({ path: strategyPath, inputs }))

    const res = await fetch(`${API_URL}/run-strategy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: strategyPath, inputs }),
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const result = await res.json()
    console.log("Backtest result:", result)

    // Эмитим событие обновления торгов
    window.dispatchEvent(new CustomEvent("refresh-trades"))

    onSuccess?.(result)
    return result
  } catch (error) {
    console.error("Backtest error:", error)
    onError?.(error)
    throw error
  }
}

// Упрощенная версия для быстрого использования
export const runBacktestSimple = async (
  strategyPath: string,
  inputs: Record<string, any>
) => {
  return runBacktest({ strategyPath, inputs })
}
