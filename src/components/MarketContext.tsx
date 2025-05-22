import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

type MarketContextType = {
  symbol: string
  timeframe: string
  setSymbol: (s: string) => void
  setTimeframe: (tf: string) => void
}

const MarketContext = createContext<MarketContextType | undefined>(undefined)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [timeframe, setTimeframe] = useState("1m")

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
