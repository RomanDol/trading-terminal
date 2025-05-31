import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { useSearchParams } from "react-router-dom"


type MarketContextType = {
  symbol: string
  timeframe: string
  setSymbol: (s: string) => void
  setTimeframe: (tf: string) => void
}

const MarketContext = createContext<MarketContextType | undefined>(undefined)

export function MarketProvider({ children }: { children: ReactNode }) {
  
  const [searchParams] = useSearchParams()

  const [symbol, setSymbol] = useState(
    () => searchParams.get("symbol") ?? "BTCUSDT"
  )
  const [timeframe, setTimeframe] = useState(
    () => searchParams.get("timeframe") ?? "1m"
  )

  useEffect(() => {
    const symbolFromUrl = searchParams.get("symbol")
    const tfFromUrl = searchParams.get("timeframe")

    if (symbolFromUrl) setSymbol(symbolFromUrl)
    if (tfFromUrl) setTimeframe(tfFromUrl)
  }, [])


  return (
    <MarketContext.Provider
      value={{ symbol, timeframe, setSymbol, setTimeframe }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context)
    throw new Error("useMarket must be used within a MarketProvider")
  return context
}
