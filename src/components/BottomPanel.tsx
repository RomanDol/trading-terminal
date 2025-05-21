import { useState } from "react"

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<"equity" | "table">("equity")

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* TAB SWITCH */}
      <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
        <TabButton
          label="📈 График"
          active={activeTab === "equity"}
          onClick={() => setActiveTab("equity")}
        />
        <TabButton
          label="📊 Таблица"
          active={activeTab === "table"}
          onClick={() => setActiveTab("table")}
        />
      </div>

      {/* TAB CONTENT */}
      <div style={{ flexGrow: 1, overflowY: "auto", padding: "1rem" }}>
        {activeTab === "equity" ? (
          <div>📈 Тут будет график доходности</div>
        ) : (
          <div>
            📊 Тут будет таблица сделок
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
                <tr>
                  <td>2024-05-01</td>
                  <td>Лонг</td>
                  <td>100</td>
                  <td>+20</td>
                </tr>
                <tr>
                  <td>2024-05-02</td>
                  <td>Шорт</td>
                  <td>120</td>
                  <td>−10</td>
                </tr>
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
      style={{
        padding: "0.5rem 1rem",
        background: active ? "#333" : "transparent",
        color: active ? "#fff" : "#888",
        border: "none",
        //   borderBottom: active ? "2px solid #00ccff" : "2px solid transparent",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </button>
  )
}
