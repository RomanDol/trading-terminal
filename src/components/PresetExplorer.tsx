import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

type PresetNode = {
  name: string
  type: "folder" | "file"
  children?: PresetNode[]
  path?: string // добавим путь для файлов
}

export default function PresetExplorer({
  onSelectPreset,
}: {
  onSelectPreset: (path: string) => void
}) {
  const [tree, setTree] = useState<PresetNode[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [expandedFolders, setExpandedFolders] = useState<string[]>(
    () => searchParams.get("expanded_presets")?.split(",") || []
  )

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/presets/tree")
      .then((res) => res.json())
      .then((data) => setTree(data))
  }, [])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("expanded_presets", expandedFolders.join(","))
      return next
    })
  }, [expandedFolders, setSearchParams])

  return (
    <div
      style={{
        padding: "1rem",
        color: "#ccc",
        fontSize: "0.9rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h4>🧩 Presets</h4>
      {tree.map((node) => (
        <TreeNode
          key={node.name}
          node={node}
          basePath=""
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          onSelectPreset={onSelectPreset}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  basePath,
  selectedPath,
  onSelect,
  onSelectPreset,
  expandedFolders,
  setExpandedFolders,
}: {
  node: PresetNode
  basePath: string
  selectedPath: string | null
  onSelect: (path: string) => void
  onSelectPreset: (path: string) => void
  expandedFolders: string[]
  setExpandedFolders: (folders: string[]) => void
}) {
  const path = `${basePath}${node.name}${node.type === "folder" ? "/" : ""}`
  const isExpanded = expandedFolders.includes(path)

  const toggleExpanded = () => {
    if (isExpanded) {
      setExpandedFolders(expandedFolders.filter((p) => p !== path))
    } else {
      setExpandedFolders([...expandedFolders, path])
    }
  }

  if (node.type === "folder") {
    return (
      <div style={{ marginLeft: "1rem" }}>
        <div
          style={{ cursor: "pointer", color: "#0af" }}
          onClick={toggleExpanded}
        >
          {isExpanded ? "📂" : "📁"} {node.name}
        </div>
        {isExpanded &&
          node.children?.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              basePath={path}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onSelectPreset={onSelectPreset}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
            />
          ))}
      </div>
    )
  }

  return (
    <div
      style={{
        marginLeft: "2rem",
        cursor: "pointer",
        color: path === selectedPath ? "#fff" : "#ccc",
        background: path === selectedPath ? "#444" : "transparent",
        padding: "2px 6px",
        borderRadius: 4,
      }}
      onClick={() => onSelect(path)}
      onDoubleClick={() => onSelectPreset(node.path || path)}
    >
      🧾 {node.name}
    </div>
  )
}
