import Chart from "./components/Chart"

function App() {
  return (
    <div style={{ background: "#000", height: "100vh", padding: "1rem" }}>
      <h1 style={{ color: "#00ccff", textAlign: "center" }}>
        📈 Trading Terminal
      </h1>
      <Chart />
    </div>
  )
}

export default App
