import { useEffect } from "react"
import Split from "split.js"
import Chart from "./Chart"
import BottomPanel from "./BottomPanel"
import MarketSelector from "./MarketSelector"
import TabbedPanel from "./TabbedPanel"

export default function ResizableLayout() {
  useEffect(() => {
    // Левая часть: график и нижняя панель (вертикально)
    Split(["#chart", "#bottom"], {
      direction: "vertical",
      sizes: [70, 30],
      minSize: [200, 100],
      gutterSize: 4,
      cursor: "row-resize",
    })

    // Вся ширина: левая часть (график + bottom) и правая панель
    Split(["#left", "#right"], {
      sizes: [75, 25],
      minSize: 200,
      gutterSize: 4,
      cursor: "col-resize",
    })
  }, [])

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Левая сторона: график + нижняя панель */}
      <div
        id="left"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* График */}
        <div
          id="chart"
          style={{
            flexGrow: 1,
            background: "#111",
            overflow: "hidden",
          }}
        >
          <Chart />
        </div>

        {/* Нижняя панель */}
        <div
          id="bottom"
          style={{
            minHeight: "60%",
            background: "#1a1a1a",
            color: "#ccc",
            overflow: "hidden",
          }}
        >
          <BottomPanel />
        </div>
      </div>

      {/* Правая панель на всю высоту */}
      <div
        id="right"
        style={{
          width: "100%",
          background: "#222",
          color: "#fff",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <TabbedPanel />
      </div>
    </div>
  )
}
