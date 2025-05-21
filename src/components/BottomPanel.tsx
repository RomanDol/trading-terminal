import { useEffect, useState } from "react"

type EquityPoint = { time: string; value: number }
type Trade = { date: string; type: string; price: number; pnl: number }

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<"equity" | "table">("equity")
  const [equity, setEquity] = useState<EquityPoint[]>([])
  const [trades, setTrades] = useState<Trade[]>([])

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
      <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
        <TabButton
          label="📈 График доходности"
          active={activeTab === "equity"}
          onClick={() => setActiveTab("equity")}
        />
        <TabButton
          label="📊 Таблица сделок"
          active={activeTab === "table"}
          onClick={() => setActiveTab("table")}
        />
      </div>

      <div style={{ flexGrow: 1, overflowY: "auto", padding: "1rem" }}>
        {activeTab === "equity" ? (
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
        ) : (
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
        borderBottom: active ? "2px solid #00ccff" : "2px solid transparent",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </button>
  )
}
