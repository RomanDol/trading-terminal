// PresetSelector.tsx — обновлённый с поддержкой onLoad

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
  }, [currentValues, strategyPath])

  const loadPreset = (name: string) => {
    setSelectedPreset(name)
    fetch(`${API}/api/presets/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath, presetName: name }),
    })
      .then((res) => res.json())
      .then((data) => data.success && onLoad(data.inputs))
  }

  const savePreset = () => {
    if (!newName.trim()) return
    fetch(`${API}/api/presets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyPath,
        presetName: newName.trim(),
        inputs: currentValues,
      }),
    }).then(() => {
      setPresets((prev) => [...prev, newName.trim()])
      setNewName("")
    })
  }

  const deletePreset = () => {
    if (!selectedPreset) return
    fetch(`${API}/api/presets/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath, presetName: selectedPreset }),
    }).then(() => {
      setPresets((prev) => prev.filter((p) => p !== selectedPreset))
      setSelectedPreset("")
    })
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
          }}
        >
          <option value="">-- Select preset --</option>
          {presets.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {selectedPreset && (
          <button onClick={deletePreset} style={{ color: "#f66" }}>
            🗑
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          placeholder="New preset name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            flexGrow: 1,
            background: "#111",
            color: "#fff",
            padding: "0.4rem",
          }}
        />
        <button
          onClick={savePreset}
          style={{ background: "#0a0", color: "#fff", padding: "0.4rem 1rem" }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
