import { useEffect, useState } from "react"
import { useMarket } from "./MarketContext"
import dayjs from "dayjs"

type EquityPoint = { time: string; value: number }
type Trade = { date: string; type: string; price: number; pnl: number }

function monthsFor(tf: string): number {
  const multiplier = {
    m: 1,
    h: 1 / 24,
    d: 1 / 720,
  }
  const match = tf.match(/^(\d+)([mhd])/)
  if (!match) return 6
  const [_, val, unit] = match
  return Math.max(
    1,
    Math.floor(+val * 6 * (multiplier[unit as "m" | "h" | "d"] || 1))
  )
}

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<"equity" | "table">("equity")
  const [equity, setEquity] = useState<EquityPoint[]>([])
  const [trades, setTrades] = useState<Trade[]>([])

  const { symbol, timeframe } = useMarket()

  // ⏱ Авторасчёт даты на 6*N месяцев назад
  const defaultStart = dayjs()
    .subtract(monthsFor(timeframe), "month")
    .format("YYYY-MM-DD")
  const defaultEnd = dayjs().format("YYYY-MM-DD")

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/equity")
      .then((res) => res.json())
      .then((data) => setEquity(data))

    fetch("http://127.0.0.1:8000/trades")
      .then((res) => res.json())
      .then((data) => setTrades(data))
  }, [])

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Info bar */}
      <div
        style={{
          padding: "0.3rem 1rem",
          background: "#191919",
          borderBottom: "1px solid #444",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.9rem",
          color: "#ccc",
          gap: "1rem",
        }}
      >
        {/* Блок слева: символ и таймфрейм */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span> {symbol}</span>
          <span>⏱ {timeframe}</span>
        </div>

        {/* Блок справа: даты */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span>
            {" "}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: "#111",
                color: "#ccc",
                border: "1px solid #444",
              }}
            />
          </span>
          <span>
            {" "}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: "#111",
                color: "#ccc",
                border: "1px solid #444",
              }}
            />
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
        <TabButton
          label="График доходности"
          active={activeTab === "equity"}
          onClick={() => setActiveTab("equity")}
        />
        <TabButton
          label="Таблица сделок"
          active={activeTab === "table"}
          onClick={() => setActiveTab("table")}
        />
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, overflowY: "auto", padding: "1rem" }}>
        {activeTab === "equity" ? (
          <EquityList equity={equity} />
        ) : (
          <TradeTable trades={trades} />
        )}
      </div>
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        padding: "0.5rem 1rem",
        background: active ? "#333" : "transparent",
        color: active ? "#fff" : "#888",
        border: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </button>
  )
}

function EquityList({ equity }: { equity: EquityPoint[] }) {
  return (
    <div>
      <h4>📈 Equity:</h4>
      <ul style={{ paddingLeft: 16 }}>
        {equity.map((point, i) => (
          <li key={i}>
            {point.time}: {point.value}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TradeTable({ trades }: { trades: Trade[] }) {
  return (
    <div>
      <h4>📊 Сделки:</h4>
      <table
        style={{
          width: "100%",
          marginTop: "1rem",
          color: "#ccc",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Дата</th>
            <th>Тип</th>
            <th>Цена</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr key={i}>
              <td>{trade.date}</td>
              <td>{trade.type}</td>
              <td>{trade.price}</td>
              <td>{trade.pnl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
