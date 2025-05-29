export function cleanPresetInputs(
  inputs: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(inputs)) {
    if (key === "isActive") continue
    if (typeof value === "object" && value !== null && "value" in value) {
      result[key] = value.value
    }
  }


  return result
}
