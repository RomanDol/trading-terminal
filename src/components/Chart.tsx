import { useEffect, useRef } from "react"
import { createChart } from "lightweight-charts"
import type { IChartApi } from "lightweight-charts"
import type { ISeriesApi } from "lightweight-charts"
import type { UTCTimestamp } from "lightweight-charts"

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#111" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
    })

    const series = chart.addLineSeries({
      color: "#00ccff",
      lineWidth: 2,
    })

    chartRef.current = chart
    seriesRef.current = series

    // Подключаемся к Binance WebSocket
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@kline_1m"
    )

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      const k = message.k // kline
      if (!k || !k.c) return

      const point = {
        time: Math.floor(k.t / 1000) as UTCTimestamp,
        value: parseFloat(k.c),
      }

      seriesRef.current?.update(point)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        )
      }
    })

    resizeObserver.observe(chartContainerRef.current)

    return () => {
      ws.close()
      chart.remove()
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
  )
}
