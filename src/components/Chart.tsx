import { useEffect, useRef, useState } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts"
import type { LogicalRange } from "lightweight-charts"

type Candle = {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
}

const SYMBOL = "btcusdt"
const INTERVAL = "1m"
const LIMIT = 1000
const MS_PER_CANDLE = 60 * 1000

export default function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  const [loadedCandles, setLoadedCandles] = useState<Candle[]>([])
  const earliestTimeRef = useRef<number | null>(null)
  const loadingRef = useRef(false)

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
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    })

    chartRef.current = chart
    seriesRef.current = series

    const fetchInitialData = async () => {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${SYMBOL.toUpperCase()}&interval=${INTERVAL}&limit=${LIMIT}`
      )
      const data = await res.json()
      const candles: Candle[] = data.map((d: any) => ({
        time: Math.floor(d[0] / 1000) as UTCTimestamp,
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      }))
      setLoadedCandles(candles)
      earliestTimeRef.current = data[0][0]
      series.setData(candles)
    }

    fetchInitialData()

    // Realtime WebSocket
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${SYMBOL}@kline_${INTERVAL}`
    )

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      const k = message.k
      if (!k || !k.t || !seriesRef.current) return

      const newCandle: Candle = {
        time: Math.floor(k.t / 1000) as UTCTimestamp,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      }

      seriesRef.current.update(newCandle)
    }

    // Lazy load handler
    const onScroll = async (range: LogicalRange | null) => {
      if (!range || loadingRef.current || !earliestTimeRef.current) return

      const barsFromLeft = range.from
      if (barsFromLeft && barsFromLeft < 50) {
        loadingRef.current = true

        const endTime = earliestTimeRef.current - 1
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${SYMBOL.toUpperCase()}&interval=${INTERVAL}&endTime=${endTime}&limit=${LIMIT}`
        )
        const data = await res.json()

        if (data.length === 0) {
          loadingRef.current = false
          return
        }

        const olderCandles: Candle[] = data.map((d: any) => ({
          time: Math.floor(d[0] / 1000) as UTCTimestamp,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }))

        setLoadedCandles((prev) => {
          const combined = [...olderCandles, ...prev]
          series.setData(combined)
          return combined
        })

        earliestTimeRef.current = data[0][0]
        loadingRef.current = false
      }
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(onScroll)

    // Resize
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
