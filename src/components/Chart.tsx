import { useEffect, useRef } from "react"
import {
  createChart,
  type LineSeriesPartialOptions,
  type IChartApi,
} from "lightweight-charts"

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

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

    chartRef.current = chart

    const lineSeries = chart.addLineSeries({
      color: "#00ccff",
      lineWidth: 2,
    } as LineSeriesPartialOptions)

    lineSeries.setData([
      { time: "2024-05-01", value: 100 },
      { time: "2024-05-02", value: 110 },
      { time: "2024-05-03", value: 105 },
      { time: "2024-05-04", value: 115 },
      { time: "2024-05-05", value: 120 },
    ])

    // 📌 Resize Observer: реагирует на изменение размера контейнера
    const observer = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        )
      }
    })

    observer.observe(chartContainerRef.current)

    return () => {
      chart.remove()
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
  )
}
