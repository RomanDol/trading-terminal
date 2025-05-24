import { useEffect, useState } from "react"

const API = import.meta.env.VITE_API_URL

export default function PresetSelector({
  strategyPath,
  currentValues,
  onLoad,
}: {
  strategyPath: string
  currentValues: { [key: string]: any }
  onLoad: (preset: any) => void
}) {
  const [presets, setPresets] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [newName, setNewName] = useState("")

  useEffect(() => {
    fetch(`${API}/api/presets/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath }),
    })
      .then((res) => res.json())
      .then((data) => setPresets(data.presets ?? []))
  }, [strategyPath])

  useEffect(() => {
    if (!strategyPath || !currentValues) return

    const timeout = setTimeout(() => {
      fetch(`${API}/api/presets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyPath,
          presetName: "__temporary",
          inputs: currentValues,
        }),
      })
    }, 1000)

    return () => clearTimeout(timeout)
  }, [JSON.stringify(currentValues), strategyPath])

  const loadPreset = (name: string) => {
    setSelectedPreset(name)
    setNewName(name)
    fetch(`${API}/api/presets/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath, presetName: name }),
    })
      .then((res) => res.json())
      .then((data) => data.success && onLoad(data.inputs))
  }

  const savePreset = () => {
    const name = newName.trim()
    if (!name) return

    const alreadyExists = presets.includes(name)
    if (alreadyExists && !window.confirm("Preset already exists. Overwrite?")) {
      return
    }

    fetch(`${API}/api/presets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyPath,
        presetName: name,
        inputs: currentValues,
      }),
    }).then(() => {
      setPresets((prev) => (alreadyExists ? prev : [...prev, name]))
      setSelectedPreset(name)
      // 👇 не очищаем newName — оставляем имя
      // setNewName("")
    })
  }

  const deletePreset = () => {
    if (!selectedPreset) return
    if (!window.confirm(`Delete preset "${selectedPreset}"?`)) return

    fetch(`${API}/api/presets/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath, presetName: selectedPreset }),
    }).then(() => {
      setPresets((prev) => prev.filter((p) => p !== selectedPreset))
      setSelectedPreset("")
      setNewName("")
    })
  }

  const sharedButtonStyle = {
    padding: "0.4rem 1rem",
    borderRadius: "4px",
    border: "1px solid #444",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    outline: "none",
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h4>💾 Presets</h4>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select
          value={selectedPreset}
          onChange={(e) => loadPreset(e.target.value)}
          style={{
            flexGrow: 1,
            background: "#111",
            color: "#fff",
            padding: "0.4rem",
            border: "1px solid #444",
            borderRadius: 4,
          }}
        >
          <option value="">-- Select preset --</option>
          {presets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button
          onClick={deletePreset}
          style={{
            ...sharedButtonStyle,
            background: "#330",
            color: "#f66",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#500")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#330")}
        >
          🗑
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="Preset name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            flexGrow: 1,
            background: "#111",
            color: "#fff",
            padding: "0.4rem",
            border: "1px solid #444",
            borderRadius: 4,
          }}
        />
        <button
          onClick={savePreset}
          style={{
            ...sharedButtonStyle,
            background: "#030",
            color: "#0f0",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#060")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#030")}
        >
          Save
        </button>
      </div>
    </div>
  )
}
