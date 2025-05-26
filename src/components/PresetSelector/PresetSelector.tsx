import { useEffect, useState } from "react"
import PresetControls from "./PresetControls"
import { usePresetManager } from "./usePresetManager"
import { replaceWithFreshTempVersion } from "./usePresetManager"

const API = import.meta.env.VITE_API_URL

export default function PresetSelector({
  strategyPath,
  currentValues,
  activePresetName,
  onSelectPreset,
}: {
  strategyPath: string
  currentValues: { [key: string]: any }
  activePresetName?: string | null
  onSelectPreset: (name: string, inputs: any) => void
}) {
  const [isLoadingPreset, setIsLoadingPreset] = useState(false)
  const [presets, setPresets] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [newName, setNewName] = useState("")

  const { loadPreset, savePreset, deletePreset } = usePresetManager({
    strategyPath,
    onSelectPreset,
    setPresets,
    setSelectedPreset,
    setNewName,
    setVersion: () => {},
    setIsLoadingPreset, // <== добавили
  })

  // Загружаем список всех пресетов
  useEffect(() => {
    fetch(`${API}/api/presets/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyPath }),
    })
      .then((res) => res.json())
      .then((data) => setPresets(data.presets ?? []))
  }, [strategyPath])

  // При инициализации — сбрасываем selected и имя
  useEffect(() => {
    if (activePresetName) {
      const baseName = activePresetName.replace(/^__\d+__/, "")
      setSelectedPreset(baseName)
      setNewName(baseName)
    }
  }, [activePresetName])

  // Автосохранение временных версий
  useEffect(() => {
    if (!strategyPath || !selectedPreset || !currentValues || isLoadingPreset)
      return

    const baseName = selectedPreset.replace(/^__\d+__/, "")
    const updatedInputs = { ...currentValues, isActive: true }

    const tempVersions = presets
      .filter((p) => p.startsWith("__") && p.endsWith(`__${baseName}`))
      .map((p) => parseInt(p.split("__")[1]))
      .filter((n) => !isNaN(n))

    const nextVersion =
      tempVersions.length > 0 ? Math.max(...tempVersions) + 1 : 1
    const tempName = `__${nextVersion}__${baseName}`

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
      })
    }, 1000)

    return () => clearTimeout(timeout)
  }, [JSON.stringify(currentValues)])

  return (
    <PresetControls
      presets={presets}
      selectedPreset={selectedPreset}
      newName={newName}
      onChangeName={setNewName}
      onSelectPreset={async (name) => {
        const baseName = selectedPreset.replace(/^__\d+__/, "")
        const tempVersions = presets
          .filter((p) => p.startsWith("__") && p.endsWith(`__${baseName}`))
          .map((p) => parseInt(p.split("__")[1]))
          .filter((n) => !isNaN(n))

        const hasUnsavedChanges =
          tempVersions.length > 1 || (tempVersions[0] ?? 0) > 0

        if (hasUnsavedChanges) {
          const confirmSave = window.confirm(
            "Do you want to save changes before switching preset?"
          )
          if (!confirmSave) return

          await savePreset(newName, currentValues, presets)
        }

        loadPreset(name, selectedPreset, presets)

        loadPreset(name, selectedPreset, presets)
      }}
      onSave={async () => {
        const oldBaseName = selectedPreset.replace(/^__\d+__/, "")
        const newBaseName = newName.replace(/^__\d+__/, "")

        const isRenaming = oldBaseName !== newBaseName

        if (isRenaming) {
          // Сохраняем новый пресет под новым именем (не трогаем старый)
          await savePreset(newBaseName, currentValues, presets)

          // Создаём только новую временную версию
          await replaceWithFreshTempVersion(
            strategyPath,
            newBaseName,
            currentValues,
            setPresets
          )

          // ❌ НЕ нужно затирать старую временную версию!
        } else {
          // Стандартное поведение — перезапись текущего
          await replaceWithFreshTempVersion(
            strategyPath,
            oldBaseName,
            currentValues,
            setPresets
          )
          await savePreset(newBaseName, currentValues, presets)
          await replaceWithFreshTempVersion(
            strategyPath,
            newBaseName,
            currentValues,
            setPresets
          )
        }
      }}
      onDelete={() => deletePreset(selectedPreset)}
    />
  )
}
