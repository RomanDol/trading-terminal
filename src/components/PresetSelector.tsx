// ✅ PresetSelector.tsx с версионированием временных пресетов
import { useEffect, useState } from "react"

const API = import.meta.env.VITE_API_URL

export default function PresetSelector({
  strategyPath,
  currentValues,
  onLoad,
  activePresetName,
  onSelectPreset,
}: {
  strategyPath: string
  currentValues: { [key: string]: any }
  onLoad?: (preset: any) => void
  activePresetName?: string | null
  onSelectPreset: (name: string, inputs: any) => void
}) {
  const [presets, setPresets] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [newName, setNewName] = useState("")
  const [version, setVersion] = useState<number>(0)

  useEffect(() => {
    fetch(`${API}/api/presets/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath }),
    })
      .then((res) => res.json())
      .then((data) => setPresets(data.presets ?? []))
  }, [strategyPath])

  // ✅ Упрощённо: просто сбрасываем имя и версию
  useEffect(() => {
    if (activePresetName) {
      const baseName = activePresetName.replace(/^__\d+__/, "")
      setSelectedPreset(baseName)
      setNewName(baseName)
      setVersion(0) // 💥 начинать с нуля
    }
  }, [activePresetName])

  useEffect(() => {
    if (!strategyPath || !selectedPreset || !currentValues) return

    const baseName = selectedPreset
    const updatedInputs = {
      ...currentValues,
      isActive: true,
    }

    // Находим все временные версии __N__baseName
    const currentVersions = presets
      .filter((p) => p.startsWith(`__`) && p.endsWith(`__${baseName}`))
      .map((p) => parseInt(p.split("__")[1]))
      .filter((n) => !isNaN(n))

    const nextVersion =
      currentVersions.length > 0 ? Math.max(...currentVersions) + 1 : 0
    const tempName = `__${version}__${selectedPreset.replace(/^__\d+__/, "")}`

    const timeout = setTimeout(() => {
      fetch(`${API}/api/presets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyPath,
          presetName: tempName,
          inputs: updatedInputs,
        }),
      }).then(() => {
        if (!presets.includes(tempName)) {
          setPresets((prev) => [...prev, tempName])
        }
        setVersion((v) => v + 1) // 💥 увеличиваем версию после сохранения
      })
    }, 1000)

    return () => clearTimeout(timeout)
  }, [JSON.stringify(currentValues)])

  const deleteTempVersions = async (base: string) => {
    // 1. Получаем актуальный список всех пресетов с сервера
    const res = await fetch(`${API}/api/presets/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath }),
    })

    const data = await res.json()
    const allPresets = data.presets ?? []

    // 2. Находим только временные версии __N__base
    const toDelete = allPresets.filter((p: string) =>
      p.match(new RegExp(`^__\\d+__${base}$`))
    )

    // 3. Отправляем запросы на удаление только существующих
    await Promise.all(
      toDelete.map((name: string) =>
        fetch(`${API}/api/presets/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strategyPath, presetName: name }),
        })
      )
    )
  }

  const loadPreset = async (name: string) => {
    const prevBase = selectedPreset.replace(/^__\d+__/, "")
    const newBase = name.replace(/^__\d+__/, "")

    // определить номер текущей временной версии (если есть)
    const currentIsTemp = selectedPreset.startsWith("__")
    const currentVersion = currentIsTemp
      ? parseInt(selectedPreset.split("__")[1])
      : null

    let discard = true
    if (currentIsTemp && currentVersion !== null && currentVersion > 0) {
      discard = !window.confirm(
        "Save changes to current preset before switching?"
      )
    }

    // ❗ удаляем временные только если база изменилась
    const baseChanged = prevBase !== newBase
    if (discard && baseChanged) {
      await deleteTempVersions(prevBase)
      setVersion(0)
    }

    const res = await fetch(`${API}/api/presets/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath, presetName: name }),
    })

    const data = await res.json()
    if (data.success) {
      setSelectedPreset(`__0__${newBase}`)
      setNewName(newBase)
      setPresets((prev) =>
        prev.includes(`__0__${newBase}`) ? prev : [...prev, `__0__${newBase}`]
      )
      onSelectPreset(`__0__${newBase}`, data.inputs)

      await fetch(`${API}/api/presets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyPath,
          presetName: `__0__${newBase}`,
          inputs: {
            ...data.inputs,
            isActive: true,
          },
        }),
      })
      const nextVersion =
        Math.max(
          0,
          ...presets
            .filter((p) => p.startsWith("__") && p.endsWith(`__${newBase}`))
            .map((p) => parseInt(p.split("__")[1]))
            .filter((n) => !isNaN(n))
        ) + 1
      setVersion(nextVersion)
    }
  }

  const savePreset = async () => {
    const name = newName.trim()
    if (!name) return

    const alreadyExists = presets.includes(name)
    if (alreadyExists && !window.confirm("Preset already exists. Overwrite?")) {
      return
    }

    await deleteTempVersions(name) // 🔧 Ждём завершения удаления

    await fetch(`${API}/api/presets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyPath,
        presetName: name,
        inputs: currentValues,
      }),
    })

    setPresets((prev) => (alreadyExists ? prev : [...prev, name]))
    setSelectedPreset(name)
  }

  const deletePreset = () => {
    if (!selectedPreset) return
    if (!window.confirm(`Delete preset \"${selectedPreset}\"?`)) return

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
          {presets
            .filter((p) => !/^__\d*__/.test(p))
            .map((p) => (
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
