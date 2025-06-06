import { useCallback } from "react"
import { cleanPresetInputs } from "../../utils/cleanInputs"
import { useMarket } from "../MarketContext" 

const API = import.meta.env.VITE_API_URL
// const { symbol, timeframe } = useMarket()
export function usePresetManager({
  presetPath,
  onSelectPreset,
  setPresets,
  setSelectedPreset,
  setNewName,
  setVersion,
  setIsLoadingPreset,
}: {
  presetPath: string
  onSelectPreset: (name: string, inputs: any) => void
  setPresets: React.Dispatch<React.SetStateAction<string[]>>
  setSelectedPreset: React.Dispatch<React.SetStateAction<string>>
  setNewName: React.Dispatch<React.SetStateAction<string>>
  setVersion: React.Dispatch<React.SetStateAction<number>>
  setIsLoadingPreset?: (value: boolean) => void
  }) {
  const deleteTempVersions = useCallback(
    async (base: string) => {
      const res = await fetch(`${API}/api/presets/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetPath }),
      })
      const data = await res.json()
      const allPresets: string[] = data.presets ?? []

      const toDelete = allPresets.filter((p) =>
        p.match(new RegExp(`^__\\d+__${base}$`))
      )

      await Promise.all(
        toDelete.map((presetName) =>
          fetch(`${API}/api/presets/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presetPath, presetName }),
          })
        )
      )
    },
    [presetPath]
  )

  const savePreset = useCallback(
    async (name: string, inputs: any, presets: string[]) => {
      if (presets.includes(name)) {
        await deleteTempVersions(name) // удаляем только если пресет уже есть
      }
      await fetch(`${API}/api/presets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetPath, presetName: name, inputs }),
      })

      setPresets((prev) => (presets.includes(name) ? prev : [...prev, name]))
      setSelectedPreset(name)
    },
    [presetPath, deleteTempVersions]
  )

  const loadPreset = useCallback(
    async (
      name: string,
      current: string,
      presets: string[],
      symbol: string,
      timeframe: string
    ) => {
      setIsLoadingPreset?.(true)
      const prevBase = current.replace(/^__\d+__/, "")
      const newBase = name.replace(/^__\d+__/, "")
      const currentIsTemp = current.startsWith("__")
      const currentVersion = currentIsTemp
        ? parseInt(current.split("__")[1])
        : null

      let discard = true
      if (currentIsTemp && currentVersion !== null && currentVersion > 0) {
        discard = !window.confirm(
          "Save changes to current preset before switching?"
        )
      }

      const baseChanged = prevBase !== newBase
      if (discard && baseChanged) {
        await deleteTempVersions(prevBase)
        setVersion(0)
      }

      const res = await fetch(`${API}/api/presets/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetPath, presetName: name }),
      })
      const data = await res.json()
      if (!data.success) return

      const autoName = `__0__${newBase}`
      setSelectedPreset(autoName)
      setNewName(newBase)
      setPresets((prev) =>
        prev.includes(autoName) ? prev : [...prev, autoName]
      )
      onSelectPreset(autoName, data.inputs)

      // Подготовка inputs с актуальными symbol/timeframe
      const updatedInputs = {
        ...data.inputs,
        symbol: data.inputs.symbol
          ? { ...data.inputs.symbol, value: symbol }
          : undefined,
        timeframe: data.inputs.timeframe
          ? { ...data.inputs.timeframe, value: timeframe }
          : undefined,
        isActive: true,
      }

      await fetch(`${API}/api/presets/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetPath,
          presetName: autoName,
          inputs: updatedInputs,
        }),
      })

      // ----------------------
      const cleanedInputs = cleanPresetInputs(data.inputs)
      console.log("run strategy - select preset")
      // console.log(data.inputs)
      console.log(cleanedInputs)

      // ----------------------

      const nextVersion =
        Math.max(
          0,
          ...presets
            .filter((p) => p.startsWith("__") && p.endsWith(`__${newBase}`))
            .map((p) => parseInt(p.split("__")[1]))
            .filter((n) => !isNaN(n))
        ) + 1

      setVersion(nextVersion)
      setIsLoadingPreset?.(false)
    },
    [presetPath, deleteTempVersions]
  )

  const deletePreset = useCallback(
    (selected: string) => {
      if (!selected) return
      if (!window.confirm(`Delete preset "${selected}"?`)) return

      const baseName = selected.replace(/^__\d+__/, "")

      fetch(`${API}/api/presets/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetPath, presetName: selected }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Удаляем из состояния все версии этого пресета
            setPresets((prev) =>
              prev.filter((p) => p !== baseName && !p.endsWith(`__${baseName}`))
            )
            setSelectedPreset("")
            setNewName("")
          } else {
            console.error("Ошибка удаления:", data.error)
          }
        })
        .catch((err) => {
          console.error("Ошибка запроса:", err)
        })
    },
    [presetPath, setPresets, setSelectedPreset, setNewName]
  )

  return {
    loadPreset,
    savePreset,
    deletePreset,
    deleteTempVersions,
  }
}




export async function replaceWithFreshTempVersion(
  presetPath: string,
  baseName: string,
  inputs: any,
  setPresets: (p: string[]) => void,
  symbol: string,
  timeframe: string
) {
  const API = import.meta.env.VITE_API_URL
  // const { symbol, timeframe } = useMarket()

  

  // Получаем текущий список пресетов
  const existingListRes = await fetch(`${API}/api/presets/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetPath }),
  })
  const existingListData = await existingListRes.json()
  const existingPresets = new Set<string>(existingListData.presets ?? [])

  const tempNames = Array.from(existingPresets).filter((p: string) =>
    /^__\d+__/.test(p)
  )

  for (const name of tempNames) {
    if (!existingPresets.has(name)) continue // безопасная проверка

    const res = await fetch(`${API}/api/presets/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presetPath, presetName: name }),
    })

    const result = await res.json()
    if (!result.success && result.error !== "Preset not found") {
      console.warn("⚠️ Ошибка удаления:", name, result.error)
    }
  }


  
  

  

  // Сохраняем новую временную версию __0__
  const tempName = `__0__${baseName}`
  const inputsCopy = { ...inputs, isActive: false }

  if (symbol && inputsCopy.symbol) {
    inputsCopy.symbol.value = symbol
  }
  if (timeframe && inputsCopy.timeframe) {
    inputsCopy.timeframe.value = timeframe
  }

  await fetch(`${API}/api/presets/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      presetPath,
      presetName: tempName,
      inputs: inputsCopy,
    }),
  })

  // Обновляем список пресетов
  const newList = await fetch(`${API}/api/presets/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetPath }),
  })
  const data = await newList.json()
  setPresets(data.presets ?? [])
}
