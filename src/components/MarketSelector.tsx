import { useEffect, useState } from "react"
import { useMarket } from "./MarketContext"

const timeframes = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]

export default function MarketSelector() {
  const {
    symbol: selectedSymbol,
    timeframe: selectedTF,
    setSymbol,
    setTimeframe,
  } = useMarket()
  const [search, setSearch] = useState("")
  const [allSymbols, setAllSymbols] = useState<string[]>([])

  // Загружаем список пар с Binance Futures
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo")
        const data = await res.json()
        const symbols = data.symbols
          .filter(
            (s: any) =>
              s.status === "TRADING" &&
              s.contractType === "PERPETUAL" &&
              s.symbol.endsWith("USDT")
          )
          .map((s: any) => s.symbol)

        setAllSymbols(symbols.sort()) // сортируем по алфавиту
      } catch (err) {
        console.error("Ошибка загрузки списка пар:", err)
      }
    }

    fetchSymbols()
  }, [])

  const filteredSymbols = allSymbols.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Таймфреймы */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          marginBottom: "0.3rem",
        }}
      >
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: "0.5rem 1rem",
              background: tf === selectedTF ? "#333" : "transparent",
              color: tf === selectedTF ? "#fff" : "#888",
              border: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Поиск */}
      <input
        type="text"
        placeholder="🔍 Найти пару..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "0.5rem",
          marginBottom: "0.5rem",
          border: "1px solid #444",
          background: "#111",
          color: "#eee",
          borderRadius: 4,
        }}
      />

      {/* Список пар */}
      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        {filteredSymbols.map((symbol) => (
          <div
            key={symbol}
            onClick={() => setSymbol(symbol)}
            style={{
              padding: "0.5rem",
              background: symbol === selectedSymbol ? "#222" : "transparent",
              color: symbol === selectedSymbol ? "#00ccff" : "#ccc",
              cursor: "pointer",
              borderBottom: "1px solid #333",
            }}
          >
            {symbol}
          </div>
        ))}
      </div>
    </div>
  )
}
