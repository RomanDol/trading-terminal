import { useEffect, useState } from "react"
import PresetControls from "./PresetControls"
import { usePresetManager } from "./usePresetManager"
import { replaceWithFreshTempVersion } from "./usePresetManager"
import { useSearchParams } from "react-router-dom"
import { cleanPresetInputs } from "../../utils/cleanInputs"

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
  const [searchParams, setSearchParams] = useSearchParams()
  // const initialPreset = searchParams.get("preset") || ""

  const [isLoadingPreset, setIsLoadingPreset] = useState(false)
  const [presets, setPresets] = useState<string[]>([])
  // const [selectedPreset, setSelectedPreset] = useState<string>(initialPreset)
  const [newName, setNewName] = useState("")

  const [selectedPreset, setSelectedPreset] = useState<string>("")

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
    // ______________
    const cleanedInputs = cleanPresetInputs(updatedInputs)
    console.log("run strategy - change input")

    // console.log(updatedInputs)
    console.log(cleanedInputs)
    // ______________

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

        // 🟢 Запуск стратегии с теми же данными
        fetch("http://127.0.0.1:8000/run-strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: strategyPath,
            inputs: updatedInputs,
          }),
        }).then(() => {
          // 🔄 Обновим таблицу
          window.dispatchEvent(new CustomEvent("refresh-trades"))
        })
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
          const confirmSave = window.confirm("Do you want to save changes?")
          if (confirmSave) return

          await savePreset(newName, currentValues, presets)
        }

        // Обновляем selectedPreset + URL
        setSelectedPreset(name)

        loadPreset(name, selectedPreset, presets)
      }}
      onSave={async () => {
        const oldBaseName = selectedPreset.replace(/^__\d+__/, "")
        const newBaseName = newName.replace(/^__\d+__/, "")

        const isRenaming = oldBaseName !== newBaseName
        const nameExists = presets.includes(newBaseName)

        if (!isRenaming && nameExists) {
          const confirmed = window.confirm(
            `Preset "${newBaseName}" already exists. Do you want to overwrite it?`
          )
          if (!confirmed) return
        }

        if (isRenaming) {
          await savePreset(newBaseName, currentValues, presets)
          await replaceWithFreshTempVersion(
            strategyPath,
            newBaseName,
            currentValues,
            setPresets
          )
        } else {
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
