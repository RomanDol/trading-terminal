import React from "react"

export default function PresetControls({
  presets,
  selectedPreset,
  newName,
  onChangeName,
  onSelectPreset,
  onSave,
  onDelete,
}: {
  presets: string[]
  selectedPreset: string
  newName: string
  onChangeName: (v: string) => void
  onSelectPreset: (name: string) => void
  onSave: () => void
  onDelete: () => void
}) {
  const sharedButtonStyle = {
    padding: "0.4rem 1rem",
    borderRadius: "4px",
    border: "1px solid #444",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    outline: "none",
  } as React.CSSProperties

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h4>💾 Presets</h4>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select
          value={selectedPreset}
          onChange={(e) => onSelectPreset(e.target.value)}
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
          {presets
            .filter((p) => !/^__\d+__/.test(p))
            .map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
        </select>

        <button
          onClick={onDelete}
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
          onChange={(e) => onChangeName(e.target.value)}
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
          onClick={onSave}
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
